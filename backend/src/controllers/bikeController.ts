import { Response } from 'express';
import { Bike } from '../models/Bike';
import { Engineer } from '../models/Engineer';
import { AuthRequest } from '../middleware/auth';

export async function getBikes(req: AuthRequest, res: Response) {
  try {
    const bikes = await Bike.find().populate('engineerId').sort({ createdAt: -1 });
    return res.json({ success: true, count: bikes.length, data: bikes });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createBike(req: AuthRequest, res: Response) {
  try {
    const { bikeNumber, bikeModel, manufacturer, fuelType, mileage } = req.body;

    if (!bikeNumber || !bikeModel || !manufacturer) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields' });
    }

    const count = await Bike.countDocuments();
    const bikeId = `BIKE-${String(count + 1).padStart(3, '0')}`;

    const bike = await Bike.create({
      bikeId,
      bikeNumber: bikeNumber.toUpperCase(),
      bikeModel,
      manufacturer,
      fuelType: fuelType || 'Petrol',
      mileage: mileage || 45,
      status: 'Active'
    });

    return res.status(201).json({ success: true, message: 'Bike registered successfully', data: bike });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateBike(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const bike = await Bike.findByIdAndUpdate(id, req.body, { new: true });
    if (!bike) {
      return res.status(404).json({ success: false, message: 'Bike not found' });
    }
    return res.json({ success: true, message: 'Bike updated', data: bike });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function assignBike(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params; // bike id
    const { engineerId } = req.body;

    const bike = await Bike.findById(id);
    if (!bike) return res.status(404).json({ success: false, message: 'Bike not found' });

    if (engineerId) {
      const engineer = await Engineer.findById(engineerId);
      if (!engineer) return res.status(404).json({ success: false, message: 'Engineer not found' });

      bike.engineerId = engineer._id as any;
      bike.assignedDate = new Date();
      await bike.save();

      engineer.assignedBike = bike._id as any;
      await engineer.save();
    } else {
      // Unassign
      if (bike.engineerId) {
        await Engineer.findByIdAndUpdate(bike.engineerId, { $unset: { assignedBike: 1 } });
      }
      bike.engineerId = undefined;
      bike.assignedDate = undefined;
      await bike.save();
    }

    return res.json({ success: true, message: 'Bike assignment updated', data: bike });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
