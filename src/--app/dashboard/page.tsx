import DashboardLayout from "@/components/DashboardLayout";
import BookingForm from "@/components/BookingForm";
import ProtectedRoute from "@/components/ProtectedRoute";


export default function Dashboard() {
  
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <BookingForm />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
