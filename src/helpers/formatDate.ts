/**
 * Formats a date string into a human-readable relative time format
 * @param dateString - ISO date string to format
 * @returns Formatted relative time string
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  
  // Convert to different time units
  const diffInMinutes = diffInMs / (1000 * 60);
  const diffInHours = diffInMs / (1000 * 60 * 60);
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
  const diffInWeeks = diffInDays / 7;

  // Handle future dates
  if (diffInMs < 0) {
    return date.toLocaleDateString();
  }

  // Less than 1 minute
  if (diffInMinutes < 1) {
    return "Just now";
  }
  
  // Less than 1 hour - show minutes
  if (diffInMinutes < 60) {
    const minutes = Math.floor(diffInMinutes);
    return `${minutes}m ago`;
  }
  
  // Less than 24 hours - show hours
  if (diffInHours < 24) {
    const hours = Math.floor(diffInHours);
    return `${hours}h ago`;
  }
  
  // Less than 7 days - show days
  if (diffInDays < 7) {
    const days = Math.floor(diffInDays);
    return `${days}d ago`;
  }
  
  // Less than 4 weeks - show weeks
  if (diffInWeeks < 4) {
    const weeks = Math.floor(diffInWeeks);
    return `${weeks}w ago`;
  }
  
  // More than 4 weeks - show actual date
  return date.toLocaleDateString();
};

export default formatDate;
