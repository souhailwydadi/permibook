export type Plan = "trial" | "99" | "199";
export type PaymentStatus = "paid" | "trial" | "unpaid" | "overdue";
export type SchoolStatus = "active" | "suspended";

export interface School {
  id: string;
  slug: string;
  name: string;
  city: string;
  phone: string;
  whatsapp: string;
  owner_id: string;
  plan: Plan;
  trial_ends_at: string | null;
  payment_status: PaymentStatus;
  paid_until: string | null;
  status: SchoolStatus;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  role: "owner" | "super_admin";
  school_id: string | null;
  created_at: string;
}

export type StudentStatus = "code" | "conduite" | "exam" | "licence";
export type Category = "B" | "A" | "C";

export interface Documents {
  cin: boolean;
  photos: boolean;
  visite_medicale: boolean;
}

export interface Student {
  id: string;
  school_id: string;
  full_name: string;
  phone: string;
  cin: string;
  category: Category;
  price_total: number;
  paid_amount: number;
  status: StudentStatus;
  instructor_id: string | null;
  documents: Documents;
  code_hours_done: number;
  driving_hours_done: number;
  created_at: string;
}

export interface Instructor {
  id: string;
  school_id: string;
  full_name: string;
  phone: string;
  categories: Category[];
  created_at: string;
}

export interface Vehicle {
  id: string;
  school_id: string;
  brand_model: string;
  plate: string;
  assurance_expiry: string | null;
  visite_technique_expiry: string | null;
  created_at: string;
}

export type LessonType = "code" | "conduite";
export type LessonStatus = "scheduled" | "done" | "absent" | "cancelled";

export interface Lesson {
  id: string;
  school_id: string;
  student_id: string;
  instructor_id: string | null;
  vehicle_id: string | null;
  type: LessonType;
  date: string;
  time: string;
  duration_min: number;
  status: LessonStatus;
  created_at: string;
  students?: { full_name: string; phone: string } | null;
  instructors?: { full_name: string } | null;
  vehicles?: { brand_model: string; plate: string } | null;
}

export type ExamType = "code" | "conduite";
export type ExamResult = "pending" | "passe" | "rate" | "ajourne";

export interface ExamCandidate {
  student_id: string;
  result: ExamResult;
}

export interface Exam {
  id: string;
  school_id: string;
  type: ExamType;
  date: string;
  location: string;
  candidates: ExamCandidate[];
  created_at: string;
}

export type PaymentMethod = "cash" | "transfer" | "cheque";

export interface Payment {
  id: string;
  school_id: string;
  student_id: string;
  amount: number;
  method: PaymentMethod;
  receipt_no: string;
  date: string;
  note: string;
  created_at: string;
  students?: { full_name: string } | null;
}

export interface WorkingHours {
  [day: string]: [string, string] | null;
}

export interface FormationPrices {
  B: number;
  A: number;
  C: number;
}

export interface Settings {
  school_id: string;
  working_hours: WorkingHours;
  language: string;
  prices: FormationPrices;
}
