import {
  Brain,
  Globe2,
  Languages,
  MapPin,
  Microscope,
  VoicemailIcon
} from "lucide-react";

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const STATS = [
  { number: "10,000+", label: "Active Farmers" },
  { number: "15+", label: "Languages Supported" },
  { number: "95%", label: "Accuracy Rate" },
  { number: "24/7", label: "Support Available" }
];

export const FEATURES = [
  {
    icon: VoicemailIcon,
    title: "Voice-Based Interface",
    description: "Natural conversations in regional languages"
  },
  {
    icon: Microscope,
    title: "Smart Soil Analysis",
    description: "Advanced soil testing with AI recommendations"
  },
  {
    icon: Brain,
    title: "AI Insights",
    description: "Intelligent farming decisions and predictions"
  },
  {
    icon: MapPin,
    title: "Precision Mapping",
    description: "Location-specific agricultural guidance"
  },
  {
    icon: Globe2,
    title: "Weather Integration",
    description: "Real-time weather updates and forecasts"
  },
  {
    icon: Languages,
    title: "Multi-Language Support",
    description: "Available in multiple global and regional languages"
  }
];

export const WORKFLOW_STEPS = [
  {
    step: "1",
    title: "Voice Input",
    description: "Speak about your farming needs",
    image: "https://images.unsplash.com/photo-1519337265831-281ec6cc8514?q=80&w=1000&auto=format&fit=crop"
  },
  {
    step: "2",
    title: "AI Analysis",
    description: "Process input and analyze farming data",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000&auto=format&fit=crop"
  },
  {
    step: "3",
    title: "Smart Recommendations",
    description: "Receive personalized farming insights",
    image: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=1000&auto=format&fit=crop"
  }
];


