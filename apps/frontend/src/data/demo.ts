export const demoTeacher = {
  name: "John Doe",
  email: "teacher@vedaai.dev",
  schoolName: "Delhi Public School",
  city: "Bokaro Steel City",
  avatarInitials: "JD",
};

export const primaryNav = [
  { label: "Home", href: "/home", icon: "grid" },
  { label: "My Groups", href: "/groups", icon: "groups" },
  { label: "Assignments", href: "/assignments", icon: "file" },
  { label: "AI Teacher's Toolkit", href: "/toolkit", icon: "sparkles" },
  { label: "My Library", href: "/library", icon: "library" },
] as const;

export const mobileNav = [
  { label: "Home", href: "/home", icon: "grid" },
  { label: "My Groups", href: "/groups", icon: "groups" },
  { label: "Library", href: "/library", icon: "library" },
  { label: "AI Toolkit", href: "/toolkit", icon: "sparkles" },
] as const;

export const seededAssignments = [
  {
    id: "assignment-1",
    title: "Quiz on Electricity",
    assignedOn: "20-06-2025",
    dueDate: "21-06-2025",
  },
  {
    id: "assignment-2",
    title: "Force and Pressure Worksheet",
    assignedOn: "24-06-2025",
    dueDate: "28-06-2025",
  },
  {
    id: "assignment-3",
    title: "Light Revision Test",
    assignedOn: "27-06-2025",
    dueDate: "30-06-2025",
  },
];
