// Mock API service that simulates backend behavior with duration support
export type MockSlot = {
  id: number;
  slot_number: string;
  location: string;
  location_id?: number;
  status: 'available' | 'booked' | 'pending';
  available_duration_minutes: number;
  created_by: number;
  created_at: string;
  availability_schedule?: string; // JSON string containing TimeSlot array
  manager_id?: number;
  manager_name?: string;
  tenant_name?: string;
  tenant_contact?: string;
};

export type MockBooking = {
  id: number;
  slot_id: number;
  user_id: number;
  status: 'active' | 'cancelled' | 'completed' | 'upcoming';
  fine: number;
  start_time: string;
  end_time: string;
  parking_duration_minutes: number;
  booked_at: string;
  user_name: string;
  slot_number: string;
  location: string;
};

export type MockNotification = {
  id: number;
  user_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
};

export type MockLocation = {
  id: number;
  name: string;
  address: string;
  created_at: string;
};

export type MockManager = {
  id: number;
  name: string;
  email: string;
  phone: string;
};

// In-memory data store
let mockLocations: MockLocation[] = [
  {
    id: 1,
    name: 'Downtown Plaza',
    address: 'Motijheel, Dhaka, Bangladesh',
    created_at: '2024-12-20T08:00:00Z'
  },
  {
    id: 2,
    name: 'Gulshan Mall',
    address: 'Gulshan-2, Dhaka, Bangladesh',
    created_at: '2024-12-20T08:00:00Z'
  },
  {
    id: 3,
    name: 'Dhanmondi Shopping Center',
    address: 'Dhanmondi-27, Dhaka, Bangladesh',
    created_at: '2024-12-20T08:00:00Z'
  }
];

let mockManagers: MockManager[] = [
  {
    id: 1,
    name: 'Ahmed Hassan',
    email: 'ahmed@manager.com',
    phone: '+880-1234-567890'
  },
  {
    id: 2,
    name: 'Sarah Khan',
    email: 'sarah@manager.com',
    phone: '+880-1234-567891'
  }
];

let mockSlots: MockSlot[] = [
  {
    id: 1,
    slot_number: 'A01',
    location: 'Downtown Plaza, Dhaka',
    location_id: 1,
    status: 'available',
    available_duration_minutes: 120,
    created_by: 1,
    created_at: '2024-12-20T10:00:00Z'
  },
  {
    id: 2,
    slot_number: 'A02',
    location: 'Downtown Plaza, Dhaka',
    location_id: 1,
    status: 'booked',
    available_duration_minutes: 60,
    created_by: 1,
    created_at: '2024-12-20T10:00:00Z'
  },
  {
    id: 3,
    slot_number: 'B01',
    location: 'Gulshan Mall, Dhaka',
    location_id: 2,
    status: 'available',
    available_duration_minutes: 180,
    created_by: 1,
    created_at: '2024-12-20T10:00:00Z'
  },
  {
    id: 4,
    slot_number: 'B02',
    location: 'Gulshan Mall, Dhaka',
    location_id: 2,
    status: 'available',
    available_duration_minutes: 90,
    created_by: 1,
    created_at: '2024-12-20T10:00:00Z'
  },
  {
    id: 5,
    slot_number: 'C01',
    location: 'Dhanmondi Shopping Center, Dhaka',
    location_id: 3,
    status: 'available',
    available_duration_minutes: 240,
    created_by: 1,
    created_at: '2024-12-20T10:00:00Z'
  }
];

let mockBookings: MockBooking[] = [
  {
    id: 1,
    slot_id: 2,
    user_id: 2,
    status: 'active',
    fine: 0,
    start_time: '2024-12-20T09:30:00Z',
    end_time: '2024-12-20T10:30:00Z',
    parking_duration_minutes: 60,
    booked_at: '2024-12-20T09:30:00Z',
    user_name: 'Alice Johnson',
    slot_number: 'A02',
    location: 'Downtown Plaza, Dhaka'
  }
];

let mockNotifications: MockNotification[] = [
  {
    id: 1,
    user_id: 1,
    message: '🎉 Welcome to the Car Parking System!',
    is_read: false,
    created_at: '2024-12-20T08:00:00Z'
  },
  {
    id: 2,
    user_id: 2,
    message: '🅿️ New slot C01 at Dhanmondi Shopping Center is now available for 4 hours!',
    is_read: false,
    created_at: '2024-12-20T09:00:00Z'
  }
];

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Socket.IO event emitter
type EventListener = (data: any) => void;
class MockSocket {
  private listeners: { [event: string]: EventListener[] } = {};
  private connected = false;

  constructor() {
    // Simulate connection after a short delay
    setTimeout(() => {
      this.connected = true;
      this.emit('connect');
    }, 1000);
  }

  on(event: string, listener: EventListener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  off(event: string, listener?: EventListener) {
    if (!this.listeners[event]) return;
    if (listener) {
      this.listeners[event] = this.listeners[event].filter(l => l !== listener);
    } else {
      this.listeners[event] = [];
    }
  }

  emit(event: string, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(listener => listener(data));
    }
  }

  disconnect() {
    this.connected = false;
    this.emit('disconnect');
  }

  get isConnected() {
    return this.connected;
  }
}

export const mockSocket = new MockSocket();

// Helper function to format duration
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min${minutes !== 1 ? 's' : ''}`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hr${hours !== 1 ? 's' : ''}`;
  }
  return `${hours}h ${remainingMinutes}m`;
};

// API functions
export const mockApi = {
  // Locations
  async getLocations(): Promise<MockLocation[]> {
    await delay(200);
    return [...mockLocations];
  },

  async createLocation(locationData: { name: string; address: string }): Promise<{ success: boolean; locationId: number }> {
    await delay(300);
    const newLocation: MockLocation = {
      id: Math.max(...mockLocations.map(l => l.id)) + 1,
      name: locationData.name,
      address: locationData.address,
      created_at: new Date().toISOString()
    };
    mockLocations.push(newLocation);
    return { success: true, locationId: newLocation.id };
  },

  // Slots
  async getSlots(status?: string): Promise<MockSlot[]> {
    await delay(300);
    let filteredSlots = mockSlots;
    if (status) {
      filteredSlots = mockSlots.filter(slot => slot.status === status);
    }
    return [...filteredSlots];
  },

  async getSlotById(slotId: number): Promise<MockSlot | null> {
    await delay(200);
    const slot = mockSlots.find(s => s.id === slotId);
    return slot ? { ...slot } : null;
  },

  async createSlot(slotData: { 
    slot_number: string; 
    location_id?: number;
    location_name?: string;
    address?: string;
    available_duration_minutes: number;
    created_by: number;
    availability_schedule?: string; // JSON string containing TimeSlot array
  }): Promise<{ success: boolean; slotId: number }> {
    await delay(500);
    
    let locationId = slotData.location_id;
    let locationName = '';
    
    // Create location if needed
    if (!locationId && slotData.location_name && slotData.address) {
      const newLocation: MockLocation = {
        id: Math.max(...mockLocations.map(l => l.id)) + 1,
        name: slotData.location_name,
        address: slotData.address,
        created_at: new Date().toISOString()
      };
      mockLocations.push(newLocation);
      locationId = newLocation.id;
      locationName = `${newLocation.name}, ${newLocation.address}`;
    } else if (locationId) {
      const location = mockLocations.find(l => l.id === locationId);
      locationName = location ? `${location.name}, ${location.address}` : 'Unknown Location';
    }

    const newSlot: MockSlot = {
      id: Math.max(...mockSlots.map(s => s.id)) + 1,
      slot_number: slotData.slot_number,
      location: locationName,
      location_id: locationId,
      status: 'available',
      available_duration_minutes: slotData.available_duration_minutes,
      created_by: slotData.created_by,
      created_at: new Date().toISOString(),
      availability_schedule: slotData.availability_schedule || undefined
    };
    mockSlots.push(newSlot);

    // Simulate real-time event
    setTimeout(() => {
      mockSocket.emit('slot_created', {
        slot_id: newSlot.id,
        slot_number: newSlot.slot_number,
        available_duration_minutes: newSlot.available_duration_minutes,
        location: newSlot.location
      });

      // Notify users
      mockSocket.emit('notification', {
        userId: 2, // User ID
        message: `🅿️ New slot ${newSlot.slot_number} at ${newSlot.location} is now available for ${formatDuration(newSlot.available_duration_minutes)}!`,
        created_at: new Date().toISOString()
      });
    }, 100);

    return { success: true, slotId: newSlot.id };
  },

  async updateSlot(slotId: number, updateData: {
    slot_number?: string;
    location_id?: number;
    location_name?: string;
    address?: string;
    available_duration_minutes?: number;
    availability_schedule?: string; // JSON string containing TimeSlot array
  }): Promise<{ success: boolean; slot: MockSlot }> {
    await delay(400);
    
    const slotIndex = mockSlots.findIndex(s => s.id === slotId);
    if (slotIndex === -1) {
      throw new Error('Slot not found');
    }

    const existingSlot = mockSlots[slotIndex];
    
    // Check if slot is currently booked and prevent certain updates
    if (existingSlot.status === 'booked' && updateData.slot_number && updateData.slot_number !== existingSlot.slot_number) {
      throw new Error('Cannot change slot number while slot is booked');
    }

    let locationId = updateData.location_id || existingSlot.location_id;
    let locationName = existingSlot.location;

    // Handle location updates
    if (updateData.location_id && updateData.location_id !== existingSlot.location_id) {
      const location = mockLocations.find(l => l.id === updateData.location_id);
      locationName = location ? `${location.name}, ${location.address}` : existingSlot.location;
    } else if (updateData.location_name && updateData.address) {
      // Create new location
      const newLocation: MockLocation = {
        id: Math.max(...mockLocations.map(l => l.id)) + 1,
        name: updateData.location_name,
        address: updateData.address,
        created_at: new Date().toISOString()
      };
      mockLocations.push(newLocation);
      locationId = newLocation.id;
      locationName = `${newLocation.name}, ${newLocation.address}`;
    }

    // Update slot
    const updatedSlot: MockSlot = {
      ...existingSlot,
      slot_number: updateData.slot_number || existingSlot.slot_number,
      location: locationName,
      location_id: locationId,
      available_duration_minutes: updateData.available_duration_minutes || existingSlot.available_duration_minutes,
      availability_schedule: updateData.availability_schedule !== undefined ? updateData.availability_schedule : existingSlot.availability_schedule,
    };

    mockSlots[slotIndex] = updatedSlot;

    // Update any existing bookings with new slot info
    mockBookings = mockBookings.map(booking => 
      booking.slot_id === slotId 
        ? { 
            ...booking, 
            slot_number: updatedSlot.slot_number,
            location: updatedSlot.location 
          }
        : booking
    );

    // Simulate real-time event
    setTimeout(() => {
      mockSocket.emit('slot_updated', {
        slot_id: updatedSlot.id,
        slot_number: updatedSlot.slot_number,
        available_duration_minutes: updatedSlot.available_duration_minutes,
        location: updatedSlot.location
      });

      // Notify admins
      mockSocket.emit('notification', {
        userId: 1, // Admin ID
        message: `✏️ Slot ${updatedSlot.slot_number} has been updated`,
        created_at: new Date().toISOString()
      });
    }, 100);

    return { success: true, slot: updatedSlot };
  },

  async deleteSlot(slotId: number): Promise<{ success: boolean; message: string }> {
    await delay(400);
    
    const slotIndex = mockSlots.findIndex(s => s.id === slotId);
    if (slotIndex === -1) {
      throw new Error('Slot not found');
    }

    const slot = mockSlots[slotIndex];
    
    // Check if slot has active bookings
    const activeBookings = mockBookings.filter(
      b => b.slot_id === slotId && (b.status === 'active' || b.status === 'upcoming')
    );
    
    if (activeBookings.length > 0) {
      throw new Error('Cannot delete slot with active bookings. Please cancel all bookings first.');
    }

    // Remove slot
    mockSlots.splice(slotIndex, 1);

    // Cancel any cancelled bookings for this slot (cleanup)
    mockBookings = mockBookings.filter(b => b.slot_id !== slotId);

    // Simulate real-time event
    setTimeout(() => {
      mockSocket.emit('slot_deleted', {
        slot_id: slotId,
        slot_number: slot.slot_number
      });

      // Notify admins
      mockSocket.emit('notification', {
        userId: 1, // Admin ID
        message: `🗑️ Slot ${slot.slot_number} has been deleted`,
        created_at: new Date().toISOString()
      });
    }, 100);

    return { success: true, message: `Slot ${slot.slot_number} deleted successfully` };
  },

  // Bookings
  async getBookings(): Promise<MockBooking[]> {
    await delay(300);
    return [...mockBookings];
  },

  async getUserBookings(userId: number): Promise<MockBooking[]> {
    await delay(300);
    return mockBookings.filter(booking => booking.user_id === userId);
  },

  async createBooking(bookingData: { 
    slot_id: number; 
    user_id: number;
    start_time: string;
    end_time: string;
    parking_duration_minutes: number;
  }): Promise<{ success: boolean; bookingId: number; bookingData: MockBooking }> {
    await delay(500);
    
    // Check if slot is available
    const slot = mockSlots.find(s => s.id === bookingData.slot_id && s.status === 'available');
    if (!slot) {
      throw new Error('Slot not available');
    }

    // Validate duration doesn't exceed slot's available duration
    if (bookingData.parking_duration_minutes > slot.available_duration_minutes) {
      throw new Error(`Parking duration cannot exceed ${formatDuration(slot.available_duration_minutes)}`);
    }

    // Update slot status
    slot.status = 'booked';

    // Create booking
    const newBooking: MockBooking = {
      id: Math.max(...mockBookings.map(b => b.id), 0) + 1,
      slot_id: bookingData.slot_id,
      user_id: bookingData.user_id,
      status: 'upcoming',
      fine: 0,
      start_time: bookingData.start_time,
      end_time: bookingData.end_time,
      parking_duration_minutes: bookingData.parking_duration_minutes,
      booked_at: new Date().toISOString(),
      user_name: bookingData.user_id === 2 ? 'John Doe' : 'Alice Johnson',
      slot_number: slot.slot_number,
      location: slot.location
    };
    mockBookings.push(newBooking);

    // Simulate real-time events
    setTimeout(() => {
      // Notify admins
      mockSocket.emit('notification', {
        userId: 1, // Admin ID
        message: `✅ ${newBooking.user_name} booked slot ${newBooking.slot_number} for ${formatDuration(newBooking.parking_duration_minutes)} (${newBooking.location})`,
        created_at: new Date().toISOString()
      });

      // Emit new booking event
      mockSocket.emit('new_booking', {
        booking_id: newBooking.id,
        user_id: newBooking.user_id,
        slot_id: newBooking.slot_id,
        parking_duration_minutes: newBooking.parking_duration_minutes,
        user_name: newBooking.user_name,
        slot_number: newBooking.slot_number,
        location: newBooking.location
      });

      // Also emit the legacy event for compatibility
      mockSocket.emit('newBooking', newBooking);
    }, 100);

    return { success: true, bookingId: newBooking.id, bookingData: newBooking };
  },

  async cancelBooking(bookingId: number, fineAmount: number = 5): Promise<{ success: boolean; message: string }> {
    await delay(500);
    
    const booking = mockBookings.find(b => b.id === bookingId);
    if (!booking || booking.status === 'cancelled') {
      throw new Error('Booking not found or already cancelled');
    }

    // Update booking
    booking.status = 'cancelled';
    booking.fine = fineAmount;

    // Update slot status
    const slot = mockSlots.find(s => s.id === booking.slot_id);
    if (slot) {
      slot.status = 'available';
    }

    // Simulate real-time events
    setTimeout(() => {
      // Notify user
      mockSocket.emit('notification', {
        userId: booking.user_id,
        message: `❌ Your booking for slot ${booking.slot_number} (${formatDuration(booking.parking_duration_minutes)}) was cancelled by admin. Fine: $${fineAmount.toFixed(2)}.`,
        created_at: new Date().toISOString()
      });

      // Emit booking cancelled event
      mockSocket.emit('bookingCancelled', {
        bookingId: booking.id,
        user_name: booking.user_name,
        slot_number: booking.slot_number,
        fine: fineAmount
      });
    }, 100);

    return { success: true, message: 'Booking cancelled and fine applied.' };
  },

  // Notifications
  async getNotifications(userId: number): Promise<MockNotification[]> {
    await delay(200);
    return mockNotifications.filter(n => n.user_id === userId);
  },

  async markNotificationRead(notificationId: number): Promise<{ success: boolean }> {
    await delay(200);
    const notification = mockNotifications.find(n => n.id === notificationId);
    if (notification) {
      notification.is_read = true;
    }
    return { success: true };
  },

  // Add notification (for testing)
  addNotification(notification: Omit<MockNotification, 'id'>) {
    const newNotification: MockNotification = {
      id: Math.max(...mockNotifications.map(n => n.id), 0) + 1,
      ...notification
    };
    mockNotifications.push(newNotification);
    return newNotification;
  },

  // Manager and Tenant Slot functions
  async getManagers(): Promise<MockManager[]> {
    await delay(200);
    return [...mockManagers];
  },

  async addManager(managerData: { name: string; email: string; phone: string }): Promise<{ success: boolean; manager_id: number }> {
    await delay(300);
    const newManager: MockManager = {
      id: Math.max(...mockManagers.map(m => m.id), 0) + 1,
      ...managerData
    };
    mockManagers.push(newManager);
    return { success: true, manager_id: newManager.id };
  },

  async createTenantSlot(slotData: {
    slot_number: string;
    manager_id: string;
    tenant_name: string;
    tenant_contact: string;
    location_id?: string;
    location_name?: string;
    address?: string;
    available_duration_minutes: number;
  }): Promise<{ success: boolean; slot_id: string }> {
    await delay(500);

    let locationId = slotData.location_id ? parseInt(slotData.location_id) : undefined;
    let locationName = '';

    // Create location if needed
    if (!locationId && slotData.location_name && slotData.address) {
      const newLocation: MockLocation = {
        id: Math.max(...mockLocations.map(l => l.id)) + 1,
        name: slotData.location_name,
        address: slotData.address,
        created_at: new Date().toISOString()
      };
      mockLocations.push(newLocation);
      locationId = newLocation.id;
      locationName = `${newLocation.name}, ${newLocation.address}`;
    } else if (locationId) {
      const location = mockLocations.find(l => l.id === locationId);
      locationName = location ? `${location.name}, ${location.address}` : 'Unknown Location';
    }

    const manager = mockManagers.find(m => m.id === parseInt(slotData.manager_id));
    const slotId = `slot-${Date.now()}`;

    const newSlot: MockSlot = {
      id: parseInt(slotId.replace('slot-', '')),
      slot_number: slotData.slot_number,
      location: locationName,
      location_id: locationId,
      status: 'pending',
      available_duration_minutes: slotData.available_duration_minutes,
      created_by: parseInt(slotData.manager_id),
      created_at: new Date().toISOString(),
      manager_id: parseInt(slotData.manager_id),
      manager_name: manager?.name,
      tenant_name: slotData.tenant_name,
      tenant_contact: slotData.tenant_contact
    };

    mockSlots.push(newSlot);

    // Notify admin about pending approval
    setTimeout(() => {
      mockSocket.emit('tenant_slot_created', {
        slot_id: slotId,
        slot_number: slotData.slot_number,
        manager_id: slotData.manager_id,
        tenant_name: slotData.tenant_name,
        status: 'pending'
      });

      // Also add notification for admin
      mockSocket.emit('notification', {
        userId: 1, // Admin ID
        message: `🏢 New tenant slot pending approval: ${slotData.slot_number} by ${slotData.tenant_name} (Manager: ${manager?.name})`,
        created_at: new Date().toISOString()
      });
    }, 100);

    return { success: true, slot_id: slotId };
  },

  async approveSlot(slotId: string): Promise<{ success: boolean; message: string }> {
    await delay(400);
    
    const slot = mockSlots.find(s => s.id === parseInt(slotId.replace('slot-', '')));
    if (!slot) {
      throw new Error('Slot not found');
    }

    slot.status = 'available';

    setTimeout(() => {
      mockSocket.emit('slot_approved', { slot_id: slotId });

      // Notify manager
      if (slot.manager_id) {
        mockSocket.emit('notification', {
          userId: slot.manager_id,
          message: `✅ Your tenant slot ${slot.slot_number} for ${slot.tenant_name} has been approved and is now available for booking`,
          created_at: new Date().toISOString()
        });
      }

      // Notify users about new slot availability
      mockSocket.emit('notification', {
        userId: 2, // User ID
        message: `🅿️ New tenant slot ${slot.slot_number} at ${slot.location} is now available for ${formatDuration(slot.available_duration_minutes)}!`,
        created_at: new Date().toISOString()
      });
    }, 100);

    return { success: true, message: 'Slot approved and available' };
  },

  async rejectSlot(slotId: string, reason?: string): Promise<{ success: boolean; message: string }> {
    await delay(400);
    
    const slotIndex = mockSlots.findIndex(s => s.id === parseInt(slotId.replace('slot-', '')));
    if (slotIndex === -1) {
      throw new Error('Slot not found');
    }

    const slot = mockSlots[slotIndex];
    mockSlots.splice(slotIndex, 1);

    setTimeout(() => {
      // Notify manager
      if (slot.manager_id) {
        mockSocket.emit('notification', {
          userId: slot.manager_id,
          message: `❌ Your tenant slot ${slot.slot_number} for ${slot.tenant_name} was rejected by admin${reason ? `: ${reason}` : ''}`,
          created_at: new Date().toISOString()
        });
      }
    }, 100);

    return { success: true, message: 'Slot rejected' };
  }
};