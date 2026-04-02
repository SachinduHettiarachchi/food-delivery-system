import React from "react";
import { Clock, CheckCircle, ChefHat, Bike, PackageCheck, XCircle, CreditCard, AlertCircle } from "lucide-react";

const STATUS_CONFIG = {
  pending:          { icon: Clock,        class: "badge-pending",          label: "Pending" },
  confirmed:        { icon: CheckCircle,  class: "badge-confirmed",        label: "Confirmed" },
  preparing:        { icon: ChefHat,      class: "badge-preparing",        label: "Preparing" },
  out_for_delivery: { icon: Bike,         class: "badge-out_for_delivery", label: "On the Way" },
  delivered:        { icon: PackageCheck, class: "badge-delivered",        label: "Delivered" },
  cancelled:        { icon: XCircle,      class: "badge-cancelled",        label: "Cancelled" },
  completed:        { icon: PackageCheck, class: "badge-completed",        label: "Completed" },
  failed:           { icon: AlertCircle,  class: "badge-failed",           label: "Failed" },
  cash:             { icon: CreditCard,   class: "badge-pending",          label: "Cash" },
  card:             { icon: CreditCard,   class: "badge-confirmed",        label: "Card" },
  online:           { icon: CreditCard,   class: "badge-delivered",        label: "Online" },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { icon: Clock, class: "badge-pending", label: status };
  const Icon = cfg.icon;
  return (
    <span className={cfg.class}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
};

export default StatusBadge;
