import type { PendingAction } from "@/types";

interface Props {
  action: PendingAction;
  onApprove: () => void;
  onDeny: () => void;
}

export function ConfirmationCard({ action, onApprove, onDeny }: Props) {
  return (
    <div className="glass-card rounded-xl2 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-amber-400" />
        <p className="text-sm font-semibold text-amber-300">Approval needed</p>
      </div>
      <div className="space-y-1 text-sm">
        <p>
          <span className="text-slate-400">Action: </span>
          <span className="text-slate-100">{action.tool}</span>
        </p>
        <p>
          <span className="text-slate-400">Affected: </span>
          <span className="text-slate-100">{action.affectedResource}</span>
        </p>
        <p>
          <span className="text-slate-400">Reason: </span>
          <span className="text-slate-100">{action.reason}</span>
        </p>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={onApprove}
          className="flex-1 rounded-full bg-neon-cyan/20 py-2 text-sm font-medium text-neon-cyan hover:bg-neon-cyan/30"
        >
          Approve
        </button>
        <button
          onClick={onDeny}
          className="flex-1 rounded-full border border-base-600 py-2 text-sm font-medium text-slate-300 hover:border-slate-400"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
