export default function TxStatus({ status, hash }) {
  if (!status) return null;

  const styles = {
    pending: "bg-yellow-900/40 border-yellow-500/50 text-yellow-300",
    success: "bg-green-900/40 border-green-500/50 text-green-300",
    error: "bg-red-900/40 border-red-500/50 text-red-300",
  };

  const icons = { pending: "⏳", success: "✅", error: "❌" };

  return (
    <div className={`border rounded-lg px-4 py-3 text-sm flex items-center gap-2 ${styles[status]}`}>
      <span>{icons[status]}</span>
      <span>
        {status === "pending" && "Transaction submitted, waiting for confirmation..."}
        {status === "success" && "Transaction confirmed!"}
        {status === "error" && "Transaction failed."}
      </span>
      {hash && (
        <span className="font-mono text-xs opacity-70 ml-auto truncate max-w-[120px]">
          {hash.slice(0, 10)}...
        </span>
      )}
    </div>
  );
}
