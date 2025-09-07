import React, { useState, useEffect } from "react";
import { LoginPage } from "./components/LoginPage";
import { UserDashboard } from "./components/UserDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { BookSlotPage } from "./components/BookSlotPageFixed";
import { BookingHistoryPage } from "./components/BookingHistoryPage";
import { ProfilePage } from "./components/ProfilePage";
import { SubscriptionPage } from "./components/SubscriptionPage";
import { NotificationPage } from "./components/NotificationPage";
import { AdminSlotManagementFixed as AdminSlotManagement } from "./components/AdminSlotManagementFixed";
import { AdminBookingManagementEnhanced as AdminBookingManagement } from "./components/AdminBookingManagementEnhanced";
import { AdminReports } from "./components/AdminReports";
import { AdminFineManagement } from "./components/AdminFineManagement";
import { EnhancedFineAnalytics } from "./components/EnhancedFineAnalytics";
import { ManagerDashboard } from "./components/ManagerDashboard";
import { OwnerDashboardFixed as OwnerDashboard } from "./components/OwnerDashboardFixed";
import { OwnerAnalytics } from "./components/OwnerAnalytics";
import { SecurityDashboardFixed as SecurityDashboard } from "./components/SecurityDashboardFixed";
import { NotificationProvider } from "./components/NotificationProvider";

export type User = {
  id: string;
  name: string;
  email: string;
  vehicleNumber: string;
  role: "user" | "admin" | "manager" | "owner" | "security";
  phone?: string;
  address?: string;
};

export type AppNotification = {
  id: string;
  user_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan: "trial" | "monthly" | "yearly";
  start_date: string;
  end_date: string;
  price_usd: number;
  price_bdt: number;
  status: "active" | "expired" | "cancelled";
  created_at: string;
};

export type Location = {
  id: string;
  name: string;
  address: string;
  totalSlots: number;
  pricingPerHour: number;
};

export type Manager = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

export type TimeSlot = {
  id: string;
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format (24-hour)
  endTime: string; // HH:MM format (24-hour)
  isRecurring?: boolean; // If true, repeats weekly
  recurringDays?: number[]; // Days of week (0=Sunday, 1=Monday, etc.)
  maxDurationMinutes: number; // Maximum booking duration for this time slot
  pricePerHour?: number; // Specific pricing for this time slot
};

export type ParkingSlot = {
  id: string;
  number: string;
  status: "available" | "booked" | "upcoming" | "pending";
  locationId: string;
  locationName?: string;
  locationAddress?: string;
  bookedBy?: string;
  bookingDate?: string;
  bookingTime?: string;
  availableDurationMinutes: number;
  // New date-time availability fields
  availableTimeSlots: TimeSlot[]; // Multiple time slots when this parking slot is available
  currentBookings?: {
    startDateTime: string; // ISO string
    endDateTime: string; // ISO string
    bookedBy: string;
    driverName?: string;
    driverPhone?: string;
    vehicleNumber?: string;
  }[]; // Current active bookings to check conflicts
  managerId?: string;
  managerName?: string;
  tenantName?: string;
  tenantContact?: string;
  createdAt?: string;
  // Owner-specific fields
  ownerId?: string;
  ownerName?: string;
  ownerContact?: string;
  spaceType?: "residential" | "commercial" | "private";
  isOwnerApproved?: boolean;
  approvalStatus?: "pending" | "approved" | "rejected";
  rejectionReason?: string;
};

export type FinePolicy = {
  type:
    | "none"
    | "immediate"
    | "hourly"
    | "daily"
    | "tiered"
    | "progressive"
    | "exponential";
  immediateRate?: number; // Fixed fine for immediate cancellation
  hourlyRate?: number; // Rate per hour
  dailyRate?: number; // Rate per day
  progressiveRates?: {
    startHour: number;
    endHour: number;
    baseRate: number;
    multiplier: number;
  }[]; // Progressive rates with multipliers
  exponentialRate?: {
    baseRate: number;
    growthFactor: number;
    maxExponent: number;
  }; // Exponential growth fine policy
  tieredRates?: {
    hours: number;
    rate: number;
    description?: string;
  }[]; // Different rates for different time periods
  maxFine?: number; // Maximum fine cap
  gracePeriodMinutes?: number; // Grace period before fine applies
  weekendMultiplier?: number; // Weekend rate multiplier
  holidayMultiplier?: number; // Holiday rate multiplier
  repeatOffenderMultiplier?: number; // Multiplier for repeat offenders
  loyaltyDiscount?: number; // Discount for loyal customers (percentage)
};

export type Booking = {
  id: string;
  slotId: string;
  slotNumber: string;
  userId: string;
  userName: string;
  date: string;
  time: string;
  status:
    | "active"
    | "completed"
    | "cancelled"
    | "upcoming"
    | "pending";
  createdAt: string;
  startTime: string;
  endTime: string;
  parkingDurationMinutes: number;
  cancelFine?: number; // Fine amount when cancelled
  cancelPolicy?: string; // Fine calculation policy description
  cancelTime?: string; // When the booking was cancelled
  timeUsedHours?: number; // How many hours were used before cancellation
  approvedBy?: string; // Admin who approved the booking
  approvedAt?: string; // When the booking was approved
  rejectedBy?: string; // Admin who rejected the booking
  rejectedAt?: string; // When the booking was rejected
  rejectionReason?: string; // Reason for rejection
};

export type SecurityMessage = {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserRole: "security" | "owner";
  toUserId: string;
  toUserName: string;
  toUserRole: "security" | "owner";
  slotId?: string;
  slotNumber?: string;
  messageType:
    | "arrival"
    | "departure"
    | "update"
    | "inquiry"
    | "alert"
    | "general";
  subject: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  isUrgent: boolean;
  attachments?: {
    type: "image" | "document";
    name: string;
    url: string;
  }[];
  metadata?: {
    vehicleNumber?: string;
    driverName?: string;
    driverPhone?: string;
    expectedTime?: string;
    actualTime?: string;
    location?: string;
  };
};

export type VehicleActivity = {
  id: string;
  slotId: string;
  slotNumber: string;
  ownerId: string;
  ownerName: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  bookingId?: string;
  expectedArrival: string;
  expectedDeparture: string;
  actualArrival?: string;
  actualDeparture?: string;
  status:
    | "expected"
    | "arrived"
    | "departed"
    | "overdue"
    | "early";
  notes?: string;
  loggedBy: string;
  loggedAt: string;
  photos?: {
    arrival?: string[];
    departure?: string[];
    violations?: string[];
  };
};

export type SecurityAlert = {
  id: string;
  slotId: string;
  slotNumber: string;
  alertType:
    | "unauthorized"
    | "damage"
    | "emergency"
    | "violation"
    | "maintenance";
  priority: "low" | "medium" | "high" | "critical";
  description: string;
  reportedBy: string;
  reportedAt: string;
  status: "open" | "investigating" | "resolved" | "dismissed";
  resolvedBy?: string;
  resolvedAt?: string;
  resolution?: string;
  photos?: string[];
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(
    null,
  );
  const [currentView, setCurrentView] =
    useState<string>("login");
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<
    User[]
  >([]);
  const [securityMessages, setSecurityMessages] = useState<
    SecurityMessage[]
  >([]);
  const [vehicleActivities, setVehicleActivities] = useState<
    VehicleActivity[]
  >([]);
  const [securityAlerts, setSecurityAlerts] = useState<
    SecurityAlert[]
  >([]);

  // Initialize sample data
  useEffect(() => {
    // Initialize sample registered users (for demo purposes)
    const initialUsers: User[] = [
      {
        id: "user-1",
        name: "John Doe",
        email: "user@test.com",
        vehicleNumber: "ABC-1234",
        role: "user",
      },
      {
        id: "admin-1",
        name: "Admin User",
        email: "admin@test.com",
        vehicleNumber: "",
        role: "admin",
      },
      {
        id: "manager-1",
        name: "Joydip Gope",
        email: "manager@test.com",
        vehicleNumber: "",
        role: "manager",
        phone: "+880-1234-567890",
      },
      {
        id: "owner-1",
        name: "Joydip Chandra Gope",
        email: "owner@test.com",
        vehicleNumber: "",
        role: "owner",
        phone: "+880-1234-567891",
        address: "House 123, Road 45, Dhanmondi, Dhaka",
      },
      {
        id: "security-1",
        name: "Mohammad Rahman",
        email: "security@test.com",
        vehicleNumber: "",
        role: "security",
        phone: "+880-1234-567892",
      },
    ];
    setRegisteredUsers(initialUsers);

    // Initialize sample managers
    const initialManagers: Manager[] = [
      {
        id: "manager-1",
        name: "Ahmed Hassan",
        email: "ahmed@manager.com",
        phone: "+880-1234-567890",
      },
      {
        id: "manager-2",
        name: "Sarah Khan",
        email: "sarah@manager.com",
        phone: "+880-1234-567891",
      },
    ];
    setManagers(initialManagers);

    // Initialize sample locations
    const initialLocations: Location[] = [
      {
        id: "location-1",
        name: "Central Parking",
        address: "Downtown, Dhaka, Bangladesh",
        totalSlots: 15,
        pricingPerHour: 50.0,
      },
      {
        id: "location-2",
        name: "Mall Parking",
        address: "Gulshan-2, Dhaka, Bangladesh",
        totalSlots: 5,
        pricingPerHour: 30.0,
      },
    ];
    setLocations(initialLocations);

    const generateSampleTimeSlots = (
      slotIndex: number,
    ): TimeSlot[] => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);

      const timeSlots: TimeSlot[] = [];

      // Regular daily availability
      if (slotIndex % 2 === 0) {
        timeSlots.push({
          id: `timeslot-${slotIndex}-1`,
          startDate: today.toISOString().split("T")[0],
          endDate: nextWeek.toISOString().split("T")[0],
          startTime: "09:00",
          endTime: "17:00",
          isRecurring: true,
          recurringDays: [1, 2, 3, 4, 5], // Monday to Friday
          maxDurationMinutes: 480,
          pricePerHour: 50,
        });
      }

      // Weekend availability
      if (slotIndex % 3 === 0) {
        timeSlots.push({
          id: `timeslot-${slotIndex}-2`,
          startDate: today.toISOString().split("T")[0],
          endDate: nextWeek.toISOString().split("T")[0],
          startTime: "10:00",
          endTime: "18:00",
          isRecurring: true,
          recurringDays: [0, 6], // Sunday and Saturday
          maxDurationMinutes: 240,
          pricePerHour: 60,
        });
      }

      // 24/7 availability for some slots
      if (slotIndex % 7 === 0) {
        timeSlots.push({
          id: `timeslot-${slotIndex}-3`,
          startDate: today.toISOString().split("T")[0],
          endDate: nextWeek.toISOString().split("T")[0],
          startTime: "00:00",
          endTime: "23:59",
          isRecurring: true,
          recurringDays: [0, 1, 2, 3, 4, 5, 6], // All days
          maxDurationMinutes: 720,
          pricePerHour: 40,
        });
      }

      // Night parking for some slots
      if (slotIndex % 4 === 0) {
        timeSlots.push({
          id: `timeslot-${slotIndex}-4`,
          startDate: today.toISOString().split("T")[0],
          endDate: nextWeek.toISOString().split("T")[0],
          startTime: "18:00",
          endTime: "08:00",
          isRecurring: true,
          recurringDays: [0, 1, 2, 3, 4, 5, 6], // All days
          maxDurationMinutes: 840, // 14 hours max
          pricePerHour: 30,
        });
      }

      return timeSlots;
    };

    const initialSlots: ParkingSlot[] = Array.from(
      { length: 20 },
      (_, i) => {
        // Determine if this is an owner slot (slots 16-19 are owner slots)
        const isOwnerSlot = i >= 16 && i < 20;
        const isOwnerApproved = isOwnerSlot
          ? i === 16 || i === 17 || i === 18
          : undefined;
        const ownerApprovalStatus = isOwnerSlot
          ? i < 19
            ? "approved"
            : "pending"
          : undefined;

        // Calculate status - owner slots need special handling
        let status:
          | "available"
          | "booked"
          | "upcoming"
          | "pending";
        if (isOwnerSlot) {
          // Owner slots: only available if approved, otherwise pending
          status = isOwnerApproved ? "available" : "pending";
        } else {
          // Regular slots: existing logic
          status =
            i % 3 === 0
              ? "booked"
              : i % 5 === 0
                ? "upcoming"
                : i >= 14 && i <= 15
                  ? "pending"
                  : "available";
        }

        return {
          id: `slot-${i + 1}`,
          number: `A${(i + 1).toString().padStart(2, "0")}`,
          status,
          locationId: i < 15 ? "location-1" : "location-2",
          locationName:
            i < 15 ? "Central Parking" : "Mall Parking",
          locationAddress:
            i < 15
              ? "Downtown, Dhaka, Bangladesh"
              : "Gulshan-2, Dhaka, Bangladesh",
          bookedBy:
            i % 3 === 0 && !isOwnerSlot
              ? `User ${Math.floor(i / 3) + 1}`
              : undefined,
          bookingDate:
            i % 3 === 0 && !isOwnerSlot
              ? "2024-12-20"
              : undefined,
          bookingTime:
            i % 3 === 0 && !isOwnerSlot
              ? "10:00 AM"
              : undefined,
          availableDurationMinutes:
            i % 4 === 0
              ? 120
              : i % 3 === 0
                ? 180
                : i % 2 === 0
                  ? 240
                  : 60, // Varying durations
          availableTimeSlots: generateSampleTimeSlots(i),
          currentBookings:
            i % 3 === 0 && !isOwnerSlot
              ? [
                  {
                    startDateTime: `2024-12-20T10:00:00Z`,
                    endDateTime: `2024-12-20T12:00:00Z`,
                    bookedBy: `User ${Math.floor(i / 3) + 1}`,
                    driverName: `Driver ${Math.floor(i / 3) + 1}`,
                    driverPhone: `+880-1111-${String(1000 + Math.floor(i / 3)).slice(-4)}`,
                    vehicleNumber: `CAR-${String(1000 + Math.floor(i / 3)).slice(-3)}`,
                  },
                ]
              : [],
          managerId: i === 19 ? "manager-1" : undefined, // Slot 20 is a tenant slot
          managerName: i === 19 ? "Ahmed Hassan" : undefined,
          tenantName:
            i === 19 ? `Business ${i - 18}` : undefined,
          tenantContact:
            i === 19 ? `+880-1234-567892` : undefined,
          createdAt: i >= 18 ? "2024-12-20" : undefined,
          // Owner-specific fields (some slots are owner-created)
          ownerId: isOwnerSlot ? "owner-1" : undefined,
          ownerName: isOwnerSlot
            ? "Joydip Chandra Gope"
            : undefined,
          ownerContact: isOwnerSlot
            ? "+880-1234-567891"
            : undefined,
          spaceType: isOwnerSlot
            ? i % 2 === 0
              ? "residential"
              : "private"
            : undefined,
          isOwnerApproved,
          approvalStatus: ownerApprovalStatus,
        };
      },
    );
    setSlots(initialSlots);

    const initialBookings: Booking[] = [
      {
        id: "booking-1",
        slotId: "slot-1",
        slotNumber: "A01",
        userId: "user-1",
        userName: "John Doe",
        date: "2024-12-20",
        time: "10:00 AM",
        status: "active",
        createdAt: "2024-12-19",
        startTime: "2024-12-20T10:00:00Z",
        endTime: "2024-12-20T11:00:00Z",
        parkingDurationMinutes: 60,
        approvedBy: "Admin User",
        approvedAt: "2024-12-19T15:30:00Z",
      },
      {
        id: "booking-2",
        slotId: "slot-4",
        slotNumber: "A04",
        userId: "user-1",
        userName: "John Doe",
        date: "2024-12-18",
        time: "2:00 PM",
        status: "completed",
        createdAt: "2024-12-18",
        startTime: "2024-12-18T14:00:00Z",
        endTime: "2024-12-18T16:00:00Z",
        parkingDurationMinutes: 120,
        approvedBy: "Admin User",
        approvedAt: "2024-12-18T09:30:00Z",
      },
      {
        id: "booking-3",
        slotId: "slot-17",
        slotNumber: "A17",
        userId: "user-1",
        userName: "John Doe",
        date: "2024-12-15",
        time: "9:00 AM",
        status: "completed",
        createdAt: "2024-12-14",
        startTime: "2024-12-15T09:00:00Z",
        endTime: "2024-12-15T11:00:00Z",
        parkingDurationMinutes: 120,
        approvedBy: "Admin User",
        approvedAt: "2024-12-14T16:00:00Z",
      },
      {
        id: "booking-4",
        slotId: "slot-17",
        slotNumber: "A17",
        userId: "user-1",
        userName: "Jane Smith",
        date: "2024-12-21",
        time: "2:00 PM",
        status: "active",
        createdAt: "2024-12-20",
        startTime: "2024-12-21T14:00:00Z",
        endTime: "2024-12-21T16:00:00Z",
        parkingDurationMinutes: 120,
        approvedBy: "Admin User",
        approvedAt: "2024-12-20T10:00:00Z",
      },
    ];
    setBookings(initialBookings);

    // Initialize sample security messages
    const initialMessages: SecurityMessage[] = [
      {
        id: "msg-1",
        fromUserId: "security-1",
        fromUserName: "Mohammad Rahman",
        fromUserRole: "security",
        toUserId: "owner-1",
        toUserName: "Sarah Ahmed",
        toUserRole: "owner",
        slotId: "slot-17",
        slotNumber: "A17",
        messageType: "arrival",
        subject: "Vehicle Arrived - Slot A17",
        message:
          "Vehicle DHK-1234 has arrived at your parking space A17. Driver: Mr. Ahmed Khan. Vehicle appears to be in good condition.",
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        isRead: false,
        isUrgent: false,
        metadata: {
          vehicleNumber: "DHK-1234",
          driverName: "Ahmed Khan",
          driverPhone: "+880-1777-123456",
          actualTime: new Date(
            Date.now() - 1800000,
          ).toISOString(),
        },
      },
      {
        id: "msg-2",
        fromUserId: "owner-1",
        fromUserName: "Sarah Ahmed",
        fromUserRole: "owner",
        toUserId: "security-1",
        toUserName: "Mohammad Rahman",
        toUserRole: "security",
        slotId: "slot-17",
        slotNumber: "A17",
        messageType: "update",
        subject: "Expected Visitor Today",
        message:
          "Expecting a blue Honda Civic (DHK-5678) around 3:00 PM today. Driver is Ms. Fatima. Please allow entry and notify me when they arrive.",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        isRead: true,
        isUrgent: false,
        metadata: {
          vehicleNumber: "DHK-5678",
          driverName: "Ms. Fatima",
          expectedTime: new Date(
            Date.now() + 3600000,
          ).toISOString(),
        },
      },
    ];
    setSecurityMessages(initialMessages);

    // Initialize sample vehicle activities
    const initialActivities: VehicleActivity[] = [
      {
        id: "act-1",
        slotId: "slot-17",
        slotNumber: "A17",
        ownerId: "owner-1",
        ownerName: "Sarah Ahmed",
        vehicleNumber: "DHK-1234",
        driverName: "Ahmed Khan",
        driverPhone: "+880-1777-123456",
        expectedArrival: new Date(
          Date.now() - 2100000,
        ).toISOString(),
        expectedDeparture: new Date(
          Date.now() + 1800000,
        ).toISOString(),
        actualArrival: new Date(
          Date.now() - 1800000,
        ).toISOString(),
        status: "arrived",
        notes:
          "Arrived 5 minutes early, vehicle in excellent condition",
        loggedBy: "Mohammad Rahman",
        loggedAt: new Date(Date.now() - 1800000).toISOString(),
      },
    ];
    setVehicleActivities(initialActivities);

    // Initialize sample security alerts
    const initialAlerts: SecurityAlert[] = [
      {
        id: "alert-1",
        slotId: "slot-17",
        slotNumber: "A17",
        alertType: "violation",
        priority: "medium",
        description:
          "Vehicle parked slightly outside designated lines",
        reportedBy: "Mohammad Rahman",
        reportedAt: new Date(
          Date.now() - 7200000,
        ).toISOString(),
        status: "resolved",
        resolvedBy: "Mohammad Rahman",
        resolvedAt: new Date(
          Date.now() - 3600000,
        ).toISOString(),
        resolution:
          "Owner contacted, vehicle repositioned correctly",
      },
    ];
    setSecurityAlerts(initialAlerts);
  }, []);

  const handleRegister = (
    name: string,
    email: string,
    password: string,
    role: "user" | "admin" | "manager" | "owner" | "security",
    vehicleNumber?: string,
    phone?: string,
    address?: string,
  ): boolean => {
    // Check if email is already registered
    const existingUser = registeredUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );
    if (existingUser) {
      return false; // Email already exists
    }

    // Create new user
    const newUser: User = {
      id: `${role}-${Date.now()}`,
      name,
      email: email.toLowerCase(),
      vehicleNumber: vehicleNumber || "",
      role,
      phone,
      address,
    };

    // Add to registered users
    setRegisteredUsers((prev) => [...prev, newUser]);

    // If it's a manager, also add to managers list
    if (role === "manager" && phone) {
      const newManager: Manager = {
        id: newUser.id,
        name,
        email: email.toLowerCase(),
        phone,
      };
      setManagers((prev) => [...prev, newManager]);
    }

    return true; // Registration successful
  };

  const handleLogin = (email: string, password: string) => {
    // First check registered users
    const registeredUser = registeredUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );

    if (registeredUser) {
      // For demo purposes, accept any password for registered users
      // In a real app, you'd verify the password hash
      setCurrentUser(registeredUser);
      setCurrentView(
        registeredUser.role === "admin"
          ? "admin-dashboard"
          : registeredUser.role === "manager"
            ? "manager-dashboard"
            : registeredUser.role === "owner"
              ? "owner-dashboard"
              : registeredUser.role === "security"
                ? "security-dashboard"
                : "user-dashboard",
      );
      return;
    }

    // Fallback to demo credentials for testing
    const validCredentials = [
      {
        email: "admin@test.com",
        password: "1234",
        role: "admin" as const,
      },
      {
        email: "manager@test.com",
        password: "1234",
        role: "manager" as const,
      },
      {
        email: "owner@test.com",
        password: "1234",
        role: "owner" as const,
      },
      {
        email: "security@test.com",
        password: "1234",
        role: "security" as const,
      },
      {
        email: "user@test.com",
        password: "1234",
        role: "user" as const,
      },
    ];

    const credential = validCredentials.find(
      (c) =>
        c.email === email.toLowerCase() &&
        c.password === password,
    );

    if (credential) {
      const user: User = {
        id: `${credential.role}-1`,
        name:
          credential.role === "admin"
            ? "Admin User"
            : credential.role === "manager"
              ? "Ahmed Hassan"
              : credential.role === "owner"
                ? "Sarah Ahmed"
                : credential.role === "security"
                  ? "Mohammad Rahman"
                  : "John Doe",
        email: credential.email,
        vehicleNumber:
          credential.role === "user" ? "ABC-1234" : "",
        role: credential.role,
        phone:
          credential.role === "manager" ||
          credential.role === "owner"
            ? "+880-1234-567890"
            : credential.role === "security"
              ? "+880-1234-567892"
              : undefined,
        address:
          credential.role === "owner"
            ? "House 123, Road 45, Dhanmondi, Dhaka"
            : undefined,
      };
      setCurrentUser(user);
      setCurrentView(
        credential.role === "admin"
          ? "admin-dashboard"
          : credential.role === "manager"
            ? "manager-dashboard"
            : credential.role === "owner"
              ? "owner-dashboard"
              : credential.role === "security"
                ? "security-dashboard"
                : "user-dashboard",
      );
      return;
    }

    alert(
      "Invalid credentials! Please check your email and password, or use the demo accounts.",
    );
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView("login");
  };

  const handleBookSlot = (
    slotId: string,
    date: string,
    time: string,
    durationMinutes: number = 60,
  ) => {
    // Parse the time correctly (if it contains just HH:MM, assume it's the start time)
    const timeStr = time.length === 5 ? `${time}:00` : time; // Add seconds if missing
    const startDateTime = new Date(`${date}T${timeStr}`);
    const endDateTime = new Date(
      startDateTime.getTime() + durationMinutes * 60000,
    );

    // Validate date-time
    if (isNaN(startDateTime.getTime())) {
      console.error("Invalid booking date-time:", date, time);
      return;
    }

    // Update slot status to pending (requires admin approval)
    setSlots((prev) =>
      prev.map((slot) => {
        if (slot.id === slotId) {
          const updatedBookings = slot.currentBookings || [];
          updatedBookings.push({
            startDateTime: startDateTime.toISOString(),
            endDateTime: endDateTime.toISOString(),
            bookedBy: currentUser?.name || "Unknown User",
          });

          return {
            ...slot,
            status: "pending" as const,
            bookedBy: currentUser?.name,
            bookingDate: date,
            bookingTime: time,
            currentBookings: updatedBookings,
          };
        }
        return slot;
      }),
    );

    // Add new booking with pending status (requires admin approval)
    const newBooking: Booking = {
      id: `booking-${Date.now()}`,
      slotId,
      slotNumber:
        slots.find((s) => s.id === slotId)?.number || "",
      userId: currentUser?.id || "",
      userName: currentUser?.name || "",
      date,
      time,
      status: "pending", // Changed to pending - requires admin approval
      createdAt: new Date().toISOString().split("T")[0],
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      parkingDurationMinutes: durationMinutes,
    };
    setBookings((prev) => [...prev, newBooking]);

    console.log(
      `📋 Slot ${slots.find((s) => s.id === slotId)?.number} booking submitted for approval - ${date} ${time} (${durationMinutes} minutes)`,
    );
  };

  const calculateCancellationFine = (
    booking: Booking,
    policy: FinePolicy,
  ): {
    fine: number;
    description: string;
    timeUsed: number;
  } => {
    const bookedAt = new Date(booking.startTime);
    const now = new Date();
    const timeUsedMs = now.getTime() - bookedAt.getTime();
    const timeUsedHours = Math.max(
      0,
      timeUsedMs / (1000 * 60 * 60),
    );
    const timeUsedMinutes = Math.max(
      0,
      timeUsedMs / (1000 * 60),
    );
    const timeUsedDays = timeUsedHours / 24;

    // Grace period check
    if (
      policy.gracePeriodMinutes &&
      timeUsedMinutes <= policy.gracePeriodMinutes
    ) {
      return {
        fine: 0,
        description: `Grace period (${policy.gracePeriodMinutes} minutes) - No fine`,
        timeUsed: timeUsedHours,
      };
    }

    // Weekend/Holiday multipliers
    const isWeekend = [0, 6].includes(bookedAt.getDay());
    const weekendMultiplier =
      isWeekend && policy.weekendMultiplier
        ? policy.weekendMultiplier
        : 1;

    // Check user's cancellation history for repeat offender multiplier
    const userCancellations = bookings.filter(
      (b) =>
        b.userId === booking.userId &&
        b.status === "cancelled" &&
        b.id !== booking.id,
    ).length;
    const repeatMultiplier =
      userCancellations >= 3 && policy.repeatOffenderMultiplier
        ? policy.repeatOffenderMultiplier
        : 1;

    let baseFine = 0;
    let description = "";

    switch (policy.type) {
      case "none":
        baseFine = 0;
        description = "No cancellation fee";
        break;

      case "immediate":
        baseFine = policy.immediateRate || 5;
        description = `Fixed cancellation fee: ${baseFine}`;
        break;

      case "hourly":
        const hourlyFine =
          Math.ceil(timeUsedHours) * (policy.hourlyRate || 2);
        baseFine = hourlyFine;
        description = `Hourly: ${Math.ceil(timeUsedHours)}h × ${policy.hourlyRate || 2} = ${baseFine}`;
        break;

      case "daily":
        const dailyFine =
          Math.ceil(timeUsedDays) * (policy.dailyRate || 20);
        baseFine = dailyFine;
        description = `Daily: ${Math.ceil(timeUsedDays)}d × ${policy.dailyRate || 20} = ${baseFine}`;
        break;

      case "progressive":
        if (policy.progressiveRates) {
          const applicableRate =
            policy.progressiveRates.find(
              (rate) =>
                timeUsedHours >= rate.startHour &&
                timeUsedHours < rate.endHour,
            ) ||
            policy.progressiveRates[
              policy.progressiveRates.length - 1
            ];

          const progressiveFactor =
            1 +
            (timeUsedHours * applicableRate.multiplier) / 100;
          baseFine =
            applicableRate.baseRate * progressiveFactor;
          description = `Progressive: ${applicableRate.baseRate} × ${progressiveFactor.toFixed(2)} = ${baseFine.toFixed(2)}`;
        }
        break;

      case "exponential":
        if (policy.exponentialRate) {
          const exponent = Math.min(
            timeUsedHours / 24,
            policy.exponentialRate.maxExponent || 3,
          );
          baseFine =
            policy.exponentialRate.baseRate *
            Math.pow(
              policy.exponentialRate.growthFactor || 1.5,
              exponent,
            );
          description = `Exponential: ${policy.exponentialRate.baseRate} × ${policy.exponentialRate.growthFactor}^${exponent.toFixed(2)} = ${baseFine.toFixed(2)}`;
        }
        break;

      case "tiered":
        if (policy.tieredRates) {
          const sortedTiers = policy.tieredRates.sort(
            (a, b) => a.hours - b.hours,
          );
          let applicableTier = sortedTiers[0];

          for (const tier of sortedTiers) {
            if (timeUsedHours >= tier.hours) {
              applicableTier = tier;
            } else {
              break;
            }
          }

          baseFine = applicableTier.rate;
          description = `Tiered: ${applicableTier.hours}+ hours = ${baseFine} (${applicableTier.description || "Standard tier"})`;
        }
        break;
    }

    // Apply multipliers
    let finalFine =
      baseFine * weekendMultiplier * repeatMultiplier;

    // Apply loyalty discount if applicable
    if (policy.loyaltyDiscount && userCancellations === 0) {
      const discountAmount =
        finalFine * (policy.loyaltyDiscount / 100);
      finalFine -= discountAmount;
      description += ` | Loyalty discount: -${discountAmount.toFixed(2)}`;
    }

    // Apply weekend/repeat multipliers to description
    if (weekendMultiplier > 1) {
      description += ` | Weekend: ×${weekendMultiplier}`;
    }
    if (repeatMultiplier > 1) {
      description += ` | Repeat offender: ×${repeatMultiplier}`;
    }

    // Apply maximum fine cap
    if (policy.maxFine) {
      finalFine = Math.min(finalFine, policy.maxFine);
      if (
        baseFine * weekendMultiplier * repeatMultiplier >
        policy.maxFine
      ) {
        description += ` | Capped at ${policy.maxFine}`;
      }
    }

    return {
      fine: Math.max(0, finalFine),
      description,
      timeUsed: timeUsedHours,
    };
  };

  const handleApproveBooking = (bookingId: string): boolean => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking || booking.status !== "pending") {
      return false;
    }

    // Update slot status to upcoming
    setSlots((prev) =>
      prev.map((slot) =>
        slot.id === booking.slotId
          ? { ...slot, status: "upcoming" as const }
          : slot,
      ),
    );

    // Update booking status to upcoming (approved)
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: "upcoming" as const,
              approvedBy: currentUser?.name || "Admin",
              approvedAt: new Date().toISOString(),
            }
          : b,
      ),
    );

    console.log(
      `✅ Booking ${bookingId} approved by ${currentUser?.name}`,
    );
    return true;
  };

  const handleRejectBooking = (
    bookingId: string,
    reason: string,
  ): boolean => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking || booking.status !== "pending") {
      return false;
    }

    // Update slot status back to available
    setSlots((prev) =>
      prev.map((slot) =>
        slot.id === booking.slotId
          ? {
              ...slot,
              status: "available" as const,
              bookedBy: undefined,
              bookingDate: undefined,
              bookingTime: undefined,
            }
          : slot,
      ),
    );

    // Update booking status to cancelled (rejected)
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: "cancelled" as const,
              rejectedBy: currentUser?.name || "Admin",
              rejectedAt: new Date().toISOString(),
              rejectionReason: reason,
            }
          : b,
      ),
    );

    console.log(
      `❌ Booking ${bookingId} rejected by ${currentUser?.name}: ${reason}`,
    );
    return true;
  };

  const handleCancelBooking = (
    bookingId: string,
    selectedPolicy: FinePolicy,
  ) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (booking) {
      const fineResult = calculateCancellationFine(
        booking,
        selectedPolicy,
      );
      const now = new Date();

      // Update slot status back to available
      setSlots((prev) =>
        prev.map((slot) =>
          slot.id === booking.slotId
            ? {
                ...slot,
                status: "available" as const,
                bookedBy: undefined,
                bookingDate: undefined,
                bookingTime: undefined,
              }
            : slot,
        ),
      );

      // Update booking status with fine information
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? {
                ...b,
                status: "cancelled" as const,
                cancelFine: fineResult.fine,
                cancelPolicy: fineResult.description,
                cancelTime: now.toISOString(),
                timeUsedHours: fineResult.timeUsed,
              }
            : b,
        ),
      );

      return {
        fine: fineResult.fine,
        description: fineResult.description,
        timeUsed: fineResult.timeUsed,
      };
    }
    return null;
  };

  const handleApproveOwnerSlot = (slotId: string): boolean => {
    const slot = slots.find((s) => s.id === slotId);
    if (!slot || slot.approvalStatus !== "pending") {
      return false;
    }

    // Update slot approval status to approved
    setSlots((prev) =>
      prev.map((s) =>
        s.id === slotId
          ? {
              ...s,
              approvalStatus: "approved" as const,
              isOwnerApproved: true,
              status: "available" as const, // Make it available for booking
            }
          : s,
      ),
    );

    console.log(
      `✅ Owner slot ${slot.number} approved by ${currentUser?.name}`,
    );
    return true;
  };

  const handleRejectOwnerSlot = (
    slotId: string,
    reason: string,
  ): boolean => {
    const slot = slots.find((s) => s.id === slotId);
    if (!slot || slot.approvalStatus !== "pending") {
      return false;
    }

    // Update slot approval status to rejected
    setSlots((prev) =>
      prev.map((s) =>
        s.id === slotId
          ? {
              ...s,
              approvalStatus: "rejected" as const,
              isOwnerApproved: false,
              rejectionReason: reason,
              status: "pending" as const, // Keep it pending/unavailable
            }
          : s,
      ),
    );

    console.log(
      `❌ Owner slot ${slot.number} rejected by ${currentUser?.name}: ${reason}`,
    );
    return true;
  };

  const handleSendSecurityMessage = (
    message: Omit<
      SecurityMessage,
      "id" | "timestamp" | "isRead"
    >,
  ): void => {
    const newMessage: SecurityMessage = {
      ...message,
      id: `msg-${Date.now()}`,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    setSecurityMessages((prev) => [newMessage, ...prev]);
  };

  const handleMarkMessageAsRead = (messageId: string): void => {
    setSecurityMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, isRead: true } : msg,
      ),
    );
  };

  const handleLogVehicleActivity = (
    activity: Omit<VehicleActivity, "id" | "loggedAt">,
  ): void => {
    const newActivity: VehicleActivity = {
      ...activity,
      id: `act-${Date.now()}`,
      loggedAt: new Date().toISOString(),
    };
    setVehicleActivities((prev) => [newActivity, ...prev]);

    // Auto-generate security message for owner
    if (
      activity.status === "arrived" ||
      activity.status === "departed"
    ) {
      const messageType =
        activity.status === "arrived" ? "arrival" : "departure";
      const subject = `Vehicle ${activity.status === "arrived" ? "Arrived" : "Departed"} - Slot ${activity.slotNumber}`;
      const message = `Vehicle ${activity.vehicleNumber} has ${activity.status === "arrived" ? "arrived at" : "departed from"} your parking space ${activity.slotNumber}. Driver: ${activity.driverName}. ${activity.notes || ""}`;

      handleSendSecurityMessage({
        fromUserId: currentUser?.id || "security-1",
        fromUserName: currentUser?.name || "Security Guard",
        fromUserRole: "security",
        toUserId: activity.ownerId,
        toUserName: activity.ownerName,
        toUserRole: "owner",
        slotId: activity.slotId,
        slotNumber: activity.slotNumber,
        messageType,
        subject,
        message,
        isUrgent: false,
        metadata: {
          vehicleNumber: activity.vehicleNumber,
          driverName: activity.driverName,
          driverPhone: activity.driverPhone,
          actualTime:
            activity.status === "arrived"
              ? activity.actualArrival
              : activity.actualDeparture,
        },
      });
    }
  };

  const handleCreateSecurityAlert = (
    alert: Omit<SecurityAlert, "id" | "reportedAt" | "status">,
  ): void => {
    const newAlert: SecurityAlert = {
      ...alert,
      id: `alert-${Date.now()}`,
      reportedAt: new Date().toISOString(),
      status: "open",
    };
    setSecurityAlerts((prev) => [newAlert, ...prev]);

    // Find slot owner and notify them if it's a high priority alert
    if (
      alert.priority === "high" ||
      alert.priority === "critical"
    ) {
      const slot = slots.find((s) => s.id === alert.slotId);
      if (slot && slot.ownerId) {
        handleSendSecurityMessage({
          fromUserId: currentUser?.id || "security-1",
          fromUserName: currentUser?.name || "Security Guard",
          fromUserRole: "security",
          toUserId: slot.ownerId,
          toUserName: slot.ownerName || "Property Owner",
          toUserRole: "owner",
          slotId: alert.slotId,
          slotNumber: alert.slotNumber,
          messageType: "alert",
          subject: `Security Alert - ${alert.alertType} (${alert.priority.toUpperCase()})`,
          message: `Security Alert for your parking space ${alert.slotNumber}: ${alert.description}. Priority: ${alert.priority.toUpperCase()}. Please respond as needed.`,
          isUrgent: alert.priority === "critical",
        });
      }
    }
  };

  const handleResolveSecurityAlert = (
    alertId: string,
    resolution: string,
  ): void => {
    setSecurityAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId
          ? {
              ...alert,
              status: "resolved" as const,
              resolvedBy: currentUser?.name || "Security Guard",
              resolvedAt: new Date().toISOString(),
              resolution,
            }
          : alert,
      ),
    );
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case "login":
        return (
          <LoginPage
            onLogin={handleLogin}
            onRegister={handleRegister}
          />
        );
      case "user-dashboard":
        return (
          <UserDashboard
            user={currentUser!}
            slots={slots}
            onNavigate={setCurrentView}
            onLogout={handleLogout}
          />
        );
      case "book-slot":
        return (
          <BookSlotPage
            user={currentUser!}
            slots={slots}
            onBook={handleBookSlot}
            onNavigate={setCurrentView}
            onLogout={handleLogout}
          />
        );
      case "booking-history":
        return (
          <BookingHistoryPage
            user={currentUser!}
            bookings={bookings.filter(
              (b) => b.userId === currentUser?.id,
            )}
            onCancel={handleCancelBooking}
            onNavigate={setCurrentView}
            onLogout={handleLogout}
          />
        );
      case "profile":
        return (
          <ProfilePage
            user={currentUser!}
            onNavigate={setCurrentView}
            onLogout={handleLogout}
          />
        );
      case "subscription":
        return (
          <SubscriptionPage
            user={currentUser!}
            onNavigate={setCurrentView}
            onLogout={handleLogout}
          />
        );
      case "notifications":
        return (
          <NotificationPage
            user={currentUser!}
            onNavigate={setCurrentView}
            onLogout={handleLogout}
          />
        );
      case "admin-dashboard":
        return (
          <AdminDashboard
            slots={slots}
            bookings={bookings}
            onNavigate={setCurrentView}
            onLogout={handleLogout}
            onApproveBooking={handleApproveBooking}
            onRejectBooking={handleRejectBooking}
            onApproveOwnerSlot={handleApproveOwnerSlot}
            onRejectOwnerSlot={handleRejectOwnerSlot}
          />
        );
      case "admin-slots":
        return (
          <AdminSlotManagement
            slots={slots}
            locations={locations}
            onUpdateSlots={setSlots}
            onUpdateLocations={setLocations}
            onNavigate={setCurrentView}
            onLogout={handleLogout}
          />
        );
      case "admin-bookings":
        return (
          <AdminBookingManagement
            bookings={bookings}
            slots={slots}
            onNavigate={setCurrentView}
            onLogout={handleLogout}
            onCancelBooking={handleCancelBooking}
            onApproveBooking={handleApproveBooking}
            onRejectBooking={handleRejectBooking}
          />
        );
      case "admin-reports":
        return (
          <AdminReports
            bookings={bookings}
            slots={slots}
            onNavigate={setCurrentView}
            onLogout={handleLogout}
          />
        );
      case "admin-fines":
        return (
          <AdminFineManagement
            bookings={bookings}
            onNavigate={setCurrentView}
            onLogout={handleLogout}
          />
        );
      case "enhanced-analytics":
        return (
          <EnhancedFineAnalytics
            bookings={bookings}
            onNavigate={setCurrentView}
            onLogout={handleLogout}
          />
        );
      case "manager-dashboard":
        return (
          <ManagerDashboard
            user={currentUser!}
            slots={slots}
            locations={locations}
            managers={managers}
            onUpdateSlots={setSlots}
            onNavigate={setCurrentView}
            onLogout={handleLogout}
          />
        );
      case "owner-dashboard":
        return (
          <OwnerDashboard
            user={currentUser!}
            slots={slots}
            bookings={bookings}
            messages={securityMessages.filter(
              (msg) =>
                msg.toUserId === currentUser?.id ||
                msg.fromUserId === currentUser?.id,
            )}
            vehicleActivities={vehicleActivities.filter(
              (act) => act.ownerId === currentUser?.id,
            )}
            securityAlerts={securityAlerts.filter((alert) => {
              const slot = slots.find(
                (s) => s.id === alert.slotId,
              );
              return slot?.ownerId === currentUser?.id;
            })}
            onNavigate={setCurrentView}
            onLogout={handleLogout}
            onUpdateSlots={setSlots}
            onSendMessage={handleSendSecurityMessage}
            onMarkMessageAsRead={handleMarkMessageAsRead}
          />
        );
      case "owner-analytics":
        return (
          <OwnerAnalytics
            user={currentUser!}
            slots={slots}
            bookings={bookings}
            vehicleActivities={vehicleActivities.filter(
              (act) => act.ownerId === currentUser?.id,
            )}
            securityAlerts={securityAlerts.filter((alert) => {
              const slot = slots.find(
                (s) => s.id === alert.slotId,
              );
              return slot?.ownerId === currentUser?.id;
            })}
            onNavigate={setCurrentView}
            onLogout={handleLogout}
          />
        );
      case "security-dashboard":
        return (
          <SecurityDashboard
            user={currentUser!}
            slots={slots}
            bookings={bookings}
            messages={securityMessages}
            vehicleActivities={vehicleActivities}
            securityAlerts={securityAlerts}
            onNavigate={setCurrentView}
            onLogout={handleLogout}
            onUpdateSlots={setSlots}
            onSendMessage={handleSendSecurityMessage}
            onLogVehicleActivity={handleLogVehicleActivity}
            onCreateAlert={handleCreateSecurityAlert}
            onResolveAlert={handleResolveSecurityAlert}
            onMarkMessageAsRead={handleMarkMessageAsRead}
          />
        );
      default:
        return (
          <LoginPage
            onLogin={handleLogin}
            onRegister={handleRegister}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {currentUser ? (
        <NotificationProvider userId={currentUser.id}>
          {renderCurrentView()}
        </NotificationProvider>
      ) : (
        renderCurrentView()
      )}
    </div>
  );
}