import { ParkingSlot, Booking } from '../../App';

export const calculateStats = (bookings: Booking[], slots: ParkingSlot[]) => {
  const totalSlots = slots.length;
  const totalBookings = bookings.length;
  const completedBookings = bookings.filter(b => b.status === 'completed').length;
  const revenue = completedBookings * 5; // $5 per booking
  const occupancyRate = totalSlots > 0 ? ((slots.filter(s => s.status !== 'available').length / totalSlots) * 100) : 0;

  return {
    totalSlots,
    totalBookings,
    completedBookings,
    revenue,
    occupancyRate
  };
};

export const getMonthlyData = () => [
  { month: 'Jan', bookings: 45, revenue: 225 },
  { month: 'Feb', bookings: 52, revenue: 260 },
  { month: 'Mar', bookings: 48, revenue: 240 },
  { month: 'Apr', bookings: 61, revenue: 305 },
  { month: 'May', bookings: 55, revenue: 275 },
  { month: 'Jun', bookings: 67, revenue: 335 },
];

export const getDailyUsage = () => [
  { hour: '6AM', usage: 15 },
  { hour: '8AM', usage: 85 },
  { hour: '10AM', usage: 65 },
  { hour: '12PM', usage: 75 },
  { hour: '2PM', usage: 60 },
  { hour: '4PM', usage: 80 },
  { hour: '6PM', usage: 70 },
  { hour: '8PM', usage: 40 },
];

export const handleExportReport = (format: string) => {
  console.log(`Exporting ${format} report...`);
  alert(`${format.toUpperCase()} report download started`);
};