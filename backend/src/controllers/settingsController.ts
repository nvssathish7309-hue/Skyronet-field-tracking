import { Response } from 'express';
import { SystemSettings } from '../models/SystemSettings';
import { AuthRequest } from '../middleware/auth';
import { AuditLog } from '../models/AuditLog';

export async function getSettings(_req: AuthRequest, res: Response) {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({
        petrolPricePerLiter: 110,
        defaultMileage: 55,
        twoWheelerRate: 2.0,
        maxReimbursementPerTrip: 2000,
        minAccuracyMeters: 50,
        gpsUpdateIntervalSeconds: 5,
        offlineTimeoutMinutes: 2,
        currency: 'INR',
        currencySymbol: '₹',
        companyName: 'Skyronet Networks'
      });
    } else {
      // Backwards compatibility for existing document
      if (!settings.petrolPricePerLiter) settings.petrolPricePerLiter = 110;
      if (!settings.defaultMileage) settings.defaultMileage = 55;
      if (!settings.twoWheelerRate || settings.twoWheelerRate === 5) {
        settings.twoWheelerRate = Math.round((settings.petrolPricePerLiter / settings.defaultMileage) * 100) / 100;
      }
      await settings.save();
    }
    return res.json({ success: true, data: settings });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateSettings(req: AuthRequest, res: Response) {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = new SystemSettings();
    }

    const petrolPrice = req.body.petrolPricePerLiter !== undefined ? Number(req.body.petrolPricePerLiter) : (settings.petrolPricePerLiter || 110);
    const mileage = req.body.defaultMileage !== undefined ? Number(req.body.defaultMileage) : (settings.defaultMileage || 55);

    // Calculate rate per KM: Petrol Price / Bike Mileage (e.g. 110 / 55 = 2.0 ₹/KM)
    const calculatedRate = Math.round((petrolPrice / Math.max(mileage, 1)) * 100) / 100;

    Object.assign(settings, req.body, {
      petrolPricePerLiter: petrolPrice,
      defaultMileage: mileage,
      twoWheelerRate: req.body.twoWheelerRate ? Number(req.body.twoWheelerRate) : calculatedRate
    });

    await settings.save();

    await AuditLog.create({
      userId: req.user!.userId as any,
      userName: req.user!.email,
      action: 'UPDATE_SETTINGS',
      entity: 'SystemSettings',
      description: `Petrol Price updated to ₹${settings.petrolPricePerLiter}/L, Mileage: ${settings.defaultMileage} KM/L => Rate: ₹${settings.twoWheelerRate}/KM`
    });

    return res.json({ success: true, message: 'Settings updated successfully', data: settings });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
