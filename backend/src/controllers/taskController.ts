import { Response } from 'express';
import { Task, TaskPriority, TaskStatus } from '../models/Task';
import { Engineer } from '../models/Engineer';
import { Notification } from '../models/Notification';
import { AuditLog } from '../models/AuditLog';
import { AuthRequest } from '../middleware/auth';
import { getIO } from '../socket';

export async function getTasks(req: AuthRequest, res: Response) {
  try {
    const { status, priority, engineerId, search } = req.query;

    const query: any = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (engineerId) query.assignedEngineer = engineerId;

    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      query.$or = [
        { taskId: searchRegex },
        { title: searchRegex },
        { customerName: searchRegex },
        { locationName: searchRegex },
        { address: searchRegex }
      ];
    }

    // If Field Engineer, show assigned tasks unless filtering
    if (req.user?.role === 'FIELD_ENGINEER') {
      const engineer = await Engineer.findOne({ userId: req.user.userId });
      if (engineer) {
        query.assignedEngineer = engineer._id;
      }
    }

    const tasks = await Task.find(query)
      .populate('assignedEngineer')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: tasks.length, data: tasks });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getTaskById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const task = await Task.findById(id)
      .populate('assignedEngineer')
      .populate('assignedBy', 'name email');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    return res.json({ success: true, data: task });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createTask(req: AuthRequest, res: Response) {
  try {
    const {
      title,
      description,
      customerName,
      customerPhone,
      locationName,
      address,
      latitude,
      longitude,
      priority,
      scheduledDate,
      scheduledTime,
      assignedEngineer
    } = req.body;

    if (
      !title ||
      !description ||
      !customerName ||
      !customerPhone ||
      !locationName ||
      !address ||
      latitude === undefined ||
      longitude === undefined
    ) {
      return res.status(400).json({ success: false, message: 'Please fill in all required task details' });
    }

    const count = await Task.countDocuments();
    const taskId = `TASK-${String(count + 1).padStart(4, '0')}`;

    const task = await Task.create({
      taskId,
      title,
      description,
      customerName,
      customerPhone,
      locationName,
      address,
      latitude: Number(latitude),
      longitude: Number(longitude),
      assignedBy: req.user!.userId as any,
      priority: (priority as TaskPriority) || 'Medium',
      scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
      scheduledTime: scheduledTime || '10:00 AM',
      status: assignedEngineer ? 'Assigned' : 'Pending',
      assignedEngineer: assignedEngineer || undefined
    });

    if (assignedEngineer) {
      const engineer = await Engineer.findById(assignedEngineer);
      if (engineer) {
        await Notification.create({
          userId: engineer.userId,
          title: 'New Task Assigned',
          message: `Task ${task.taskId}: ${task.title} at ${task.locationName}`,
          type: 'INFO',
          link: `/my-tasks/${task._id}`
        });

        // Notify socket
        try {
          getIO().emit('task:assigned', { taskId: task._id, engineerId: engineer._id });
        } catch (_) {}
      }
    }

    await AuditLog.create({
      userId: req.user!.userId as any,
      userName: req.user!.email,
      action: 'CREATE_TASK',
      entity: 'Task',
      entityId: task.taskId,
      description: `Task ${task.taskId} created: ${task.title}`
    });

    return res.status(201).json({ success: true, message: 'Task created successfully', data: task });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function assignTask(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { engineerId } = req.body;

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const engineer = await Engineer.findById(engineerId);
    if (!engineer) return res.status(404).json({ success: false, message: 'Engineer not found' });

    task.assignedEngineer = engineer._id as any;
    task.status = 'Assigned';
    await task.save();

    await Notification.create({
      userId: engineer.userId,
      title: 'Task Assigned to You',
      message: `${task.taskId}: ${task.title} assigned by Admin`,
      type: 'INFO',
      link: `/my-tasks/${task._id}`
    });

    try {
      getIO().emit('task:assigned', { taskId: task._id, engineerId: engineer._id });
    } catch (_) {}

    return res.json({ success: true, message: 'Task assigned successfully', data: task });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateTaskStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, workNotes, materialsUsed } = req.body;

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    task.status = status as TaskStatus;
    if (workNotes) task.workNotes = workNotes;
    if (materialsUsed) task.materialsUsed = materialsUsed;

    if (status === 'In Progress' && !task.startTime) {
      task.startTime = new Date();
    } else if (status === 'Completed') {
      task.endTime = new Date();
    }

    await task.save();

    // Update engineer status if relevant
    if (task.assignedEngineer) {
      const engineer = await Engineer.findById(task.assignedEngineer);
      if (engineer) {
        if (status === 'On The Way') engineer.status = 'On The Way';
        else if (status === 'In Progress') engineer.status = 'On Task';
        else if (status === 'Completed') {
          engineer.status = 'Available';
          engineer.activeTaskId = undefined;
        }
        await engineer.save();
      }
    }

    try {
      getIO().emit('task:status-updated', { taskId: task._id, status });
    } catch (_) {}

    return res.json({ success: true, message: `Task status updated to ${status}`, data: task });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function uploadTaskPhotos(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'No photos attached' });
    }

    const uploadedPhotos = files.map((file) => ({
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      uploadedAt: new Date(),
      caption: req.body.caption || 'Site Photo'
    }));

    task.photos.push(...uploadedPhotos);
    await task.save();

    return res.json({ success: true, message: 'Photos uploaded successfully', data: task });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
