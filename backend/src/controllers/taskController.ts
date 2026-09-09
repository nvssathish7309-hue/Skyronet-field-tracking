import { Response } from 'express';
import mongoose from 'mongoose';
import { Task, TaskPriority, TaskStatus } from '../models/Task';
import { Engineer } from '../models/Engineer';
import { Notification } from '../models/Notification';
import { AuditLog } from '../models/AuditLog';
import { AuthRequest } from '../middleware/auth';
import { getIO } from '../socket';
import { getInMemoryStore, saveStoreToDisk } from '../utils/inMemoryDB';

export async function getTasks(req: AuthRequest, res: Response) {
  try {
    const { status, priority, engineerId, search } = req.query;

    if (mongoose.connection.readyState !== 1) {
      const store = getInMemoryStore();
      let result = [...store.tasks];

      if (status) result = result.filter((t) => t.status === status);
      if (priority) result = result.filter((t) => t.priority === priority);
      if (engineerId) {
        result = result.filter((t) => t.assignedEngineer && (t.assignedEngineer._id === engineerId || t.assignedEngineer === engineerId));
      }
      if (search) {
        const searchRegex = new RegExp(String(search), 'i');
        result = result.filter(
          (t) =>
            searchRegex.test(t.taskId || '') ||
            searchRegex.test(t.title || '') ||
            searchRegex.test(t.customerName || '') ||
            searchRegex.test(t.locationName || '') ||
            searchRegex.test(t.address || '')
        );
      }

      if (req.user?.role === 'FIELD_ENGINEER') {
        const eng = store.engineers.find((e) => e.userId === req.user!.userId || e.email === req.user!.email);
        if (eng) {
          result = result.filter((t) => t.assignedEngineer && (t.assignedEngineer._id === eng._id || t.assignedEngineer.email === eng.email));
        }
      }

      return res.json({ success: true, count: result.length, data: result });
    }

    const query: any = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (engineerId && mongoose.Types.ObjectId.isValid(String(engineerId))) query.assignedEngineer = engineerId;

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

    if (mongoose.connection.readyState !== 1) {
      const store = getInMemoryStore();
      const task = store.tasks.find((t) => t._id === id || t.taskId === id);
      if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
      return res.json({ success: true, data: task });
    }

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

    if (mongoose.connection.readyState !== 1) {
      const store = getInMemoryStore();
      const count = store.tasks.length;
      const taskId = `TASK-${String(count + 1).padStart(4, '0')}`;
      const newId = `task_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      let assignedEngObj: any = null;
      if (assignedEngineer && assignedEngineer.trim() !== '') {
        assignedEngObj = store.engineers.find(
          (e) => e._id.toString() === assignedEngineer.toString() || e.engineerId === assignedEngineer
        );
      }

      const newTask = {
        _id: newId,
        taskId,
        title,
        description,
        customerName,
        customerPhone,
        locationName,
        address,
        latitude: Number(latitude),
        longitude: Number(longitude),
        assignedBy: { _id: req.user?.userId || 'usr_admin', name: req.user?.email || 'Admin' },
        priority: priority || 'Medium',
        scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
        scheduledTime: scheduledTime || '10:00 AM',
        status: assignedEngObj ? 'Assigned' : 'Pending',
        assignedEngineer: assignedEngObj || undefined,
        photos: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      store.tasks.unshift(newTask);
      saveStoreToDisk();

      try {
        getIO().emit('task:status-updated', { taskId: newTask._id, status: newTask.status });
      } catch (_) {}

      return res.status(201).json({ success: true, message: 'Task created successfully', data: newTask });
    }

    const count = await Task.countDocuments();
    const taskId = `TASK-${String(count + 1).padStart(4, '0')}`;

    const cleanAssignedEngineer = (assignedEngineer && mongoose.Types.ObjectId.isValid(assignedEngineer))
      ? assignedEngineer
      : undefined;

    const cleanAssignedBy = (req.user?.userId && mongoose.Types.ObjectId.isValid(req.user.userId))
      ? req.user.userId
      : new mongoose.Types.ObjectId();

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
      assignedBy: cleanAssignedBy as any,
      priority: (priority as TaskPriority) || 'Medium',
      scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
      scheduledTime: scheduledTime || '10:00 AM',
      status: cleanAssignedEngineer ? 'Assigned' : 'Pending',
      assignedEngineer: cleanAssignedEngineer as any
    });

    if (cleanAssignedEngineer) {
      const engineer = await Engineer.findById(cleanAssignedEngineer);
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

    try {
      await AuditLog.create({
        userId: cleanAssignedBy as any,
        userName: req.user!.email,
        action: 'CREATE_TASK',
        entity: 'Task',
        entityId: task.taskId,
        description: `Task ${task.taskId} created: ${task.title}`
      });
    } catch (_) {}

    return res.status(201).json({ success: true, message: 'Task created successfully', data: task });
  } catch (error: any) {
    console.error('Task create error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create task' });
  }
}

export async function assignTask(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { engineerId } = req.body;

    if (mongoose.connection.readyState !== 1) {
      const store = getInMemoryStore();
      const task = store.tasks.find((t) => t._id === id || t.taskId === id);
      if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

      const engineer = store.engineers.find((e) => e._id === engineerId || e.engineerId === engineerId);
      if (!engineer) return res.status(404).json({ success: false, message: 'Engineer not found' });

      task.assignedEngineer = engineer;
      task.status = 'Assigned';
      task.updatedAt = new Date();

      try {
        getIO().emit('task:assigned', { taskId: task._id, engineerId: engineer._id });
      } catch (_) {}

      return res.json({ success: true, message: 'Task assigned successfully', data: task });
    }

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const engineer = await Engineer.findById(engineerId);
    if (!engineer) return res.status(404).json({ success: false, message: 'Engineer not found' });

    task.assignedEngineer = engineer._id as any;
    task.status = 'Assigned';
    await task.save();

    try {
      await Notification.create({
        userId: engineer.userId,
        title: 'Task Assigned to You',
        message: `${task.taskId}: ${task.title} assigned by Admin`,
        type: 'INFO',
        link: `/my-tasks/${task._id}`
      });
    } catch (_) {}

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

    if (mongoose.connection.readyState !== 1) {
      const store = getInMemoryStore();
      const task = store.tasks.find((t) => t._id === id || t.taskId === id);
      if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

      task.status = status as TaskStatus;
      if (workNotes) task.workNotes = workNotes;
      if (materialsUsed) task.materialsUsed = materialsUsed;

      if (status === 'In Progress' && !task.startTime) {
        task.startTime = new Date();
      } else if (status === 'Completed') {
        task.endTime = new Date();
      }
      task.updatedAt = new Date();

      if (task.assignedEngineer) {
        const engId = typeof task.assignedEngineer === 'object' ? task.assignedEngineer._id : task.assignedEngineer;
        const engineer = store.engineers.find((e) => e._id === engId);
        if (engineer) {
          if (status === 'On The Way') engineer.status = 'On The Way';
          else if (status === 'In Progress') engineer.status = 'On Task';
          else if (status === 'Completed') {
            engineer.status = 'Available';
            engineer.activeTaskId = undefined;
          }
        }
      }

      try {
        getIO().emit('task:status-updated', { taskId: task._id, status });
      } catch (_) {}

      return res.json({ success: true, message: `Task status updated to ${status}`, data: task });
    }

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

export async function updateTask(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
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
      assignedEngineer,
      status
    } = req.body;

    if (mongoose.connection.readyState !== 1) {
      const store = getInMemoryStore();
      const task = store.tasks.find((t) => t._id === id || t.taskId === id);
      if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (customerName !== undefined) task.customerName = customerName;
      if (customerPhone !== undefined) task.customerPhone = customerPhone;
      if (locationName !== undefined) task.locationName = locationName;
      if (address !== undefined) task.address = address;
      if (latitude !== undefined) task.latitude = Number(latitude);
      if (longitude !== undefined) task.longitude = Number(longitude);
      if (priority !== undefined) task.priority = priority;
      if (scheduledDate !== undefined) task.scheduledDate = new Date(scheduledDate);
      if (scheduledTime !== undefined) task.scheduledTime = scheduledTime;

      if (assignedEngineer !== undefined) {
        if (!assignedEngineer || assignedEngineer.trim() === '') {
          task.assignedEngineer = undefined;
          if (task.status === 'Assigned') task.status = 'Pending';
        } else {
          const eng = store.engineers.find(
            (e) => e._id.toString() === assignedEngineer.toString() || e.engineerId === assignedEngineer
          );
          if (eng) {
            task.assignedEngineer = eng;
            if (task.status === 'Pending') task.status = 'Assigned';
          }
        }
      }

      if (status !== undefined) task.status = status;
      task.updatedAt = new Date();

      saveStoreToDisk();

      try {
        getIO().emit('task:status-updated', { taskId: task._id, status: task.status });
      } catch (_) {}

      return res.json({ success: true, message: 'Task updated successfully', data: task });
    }

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (customerName !== undefined) task.customerName = customerName;
    if (customerPhone !== undefined) task.customerPhone = customerPhone;
    if (locationName !== undefined) task.locationName = locationName;
    if (address !== undefined) task.address = address;
    if (latitude !== undefined) task.latitude = Number(latitude);
    if (longitude !== undefined) task.longitude = Number(longitude);
    if (priority !== undefined) task.priority = priority as TaskPriority;
    if (scheduledDate !== undefined) task.scheduledDate = new Date(scheduledDate);
    if (scheduledTime !== undefined) task.scheduledTime = scheduledTime;

    if (assignedEngineer !== undefined) {
      if (!assignedEngineer || assignedEngineer.trim() === '' || assignedEngineer === 'null') {
        task.assignedEngineer = undefined;
        if (task.status === 'Assigned') task.status = 'Pending';
      } else if (mongoose.Types.ObjectId.isValid(assignedEngineer)) {
        task.assignedEngineer = assignedEngineer as any;
        if (task.status === 'Pending') task.status = 'Assigned';
      }
    }

    if (status !== undefined) task.status = status as TaskStatus;

    await task.save();

    const updatedTask = await Task.findById(id)
      .populate('assignedEngineer')
      .populate('assignedBy', 'name email');

    try {
      getIO().emit('task:status-updated', { taskId: task._id, status: task.status });
    } catch (_) {}

    return res.json({ success: true, message: 'Task updated successfully', data: updatedTask || task });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to update task' });
  }
}

