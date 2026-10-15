import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Landmark, PlusCircle, X, CreditCard, Eye } from "lucide-react";
import {
  bankAccounts,
  totalBankBalance,
  fmtINR,
  fmtDate,
} from "@/lib/finance-data";
import {
  SectionCard,
  StatTile,
  StatusPill,
  PrimaryButton,
  SecondaryButton,
  TableWrapper,
  Th,
  Td,
} from "@/components/finance/shared";

const BANK_COLORS: Record<string, { header: string; badge: string }> = {
  "HDFC Bank": { header: "from-indigo-600 to-blue-500", badge: "bg-indigo-100 text-indigo-700" },
  "ICICI Bank": { header: "from-orange-500 to-amber-400", badge: "bg-orange-100 text-orange-700" },
  "SBI Bank": { header: "from-blue-700 to-blue-500", badge: "bg-blue-100 text-blue-700" },
};

export function BankAccountsTab() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [viewAllBank, setViewAllBank] = useState<string | null>(null);

  const activeCount = bankAccounts.length;

  return (
    <div className="space-y-6">
      {/* Stat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatTile
          label="Total Bank Balance"
          value={fmtINR(totalBankBalance)}
          sub="Across all accounts"
          icon={Landmark}
          bg="bg-indigo-50"
          iconColor="text-indigo-600"
          index={0}
        />
        <StatTile
          label="No. of Accounts"
          value={String(bankAccounts.length)}
          sub="Linked bank accounts"
          icon={Building2}
          bg="bg-emerald-50"
          iconColor="text-emerald-600"
          index={1}
        />
        <StatTile
          label="Active Accounts"
          value={String(activeCount)}
          sub="Currently operational"
          icon={CreditCard}
          bg="bg-blue-50"
          iconColor="text-blue-600"
          index={2}
        />
      </div>

      {/* Header with Add Account */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Bank Accounts</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage and monitor all linked bank accounts</p>
        </div>
        <PrimaryButton icon={PlusCircle} onClick={() => setShowAddDialog(true)}>
          Add Account
        </PrimaryButton>
      </div>

      {/* Account Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {bankAccounts.map((account, idx) => {
          const colors = BANK_COLORS[account.bankName] ?? { header: "from-slate-600 to-slate-500", badge: "bg-slate-100 text-slate-700" };
          return (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.07, ease: "easeOut" }}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col"
            >
              {/* Colored Header Strip */}
              <div className={`bg-gradient-to-r ${colors.header} px-5 py-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{account.bankName}</p>
                      <p className="text-[11px] text-white/75">{account.ifsc}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${colors.badge}`}>
                    {account.accountType}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="flex-1 p-5 space-y-4">
                {/* Account Info */}
                <div>
                  <p className="text-xs text-muted-foreground">Account Holder</p>
                  <p className="text-sm font-medium text-foreground mt-0.5">{account.accountHolder}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Account Number</p>
                    <p className="text-sm font-mono font-medium text-foreground mt-0.5">{account.accountNumber}</p>
                  </div>
                </div>

                {/* Balance */}
                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-xs text-muted-foreground">Current Balance</p>
                  <p className="text-xl font-bold text-foreground mt-1">{fmtINR(account.balance)}</p>
                </div>

                {/* Recent Transactions */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Recent Transactions</p>
                  <div className="space-y-0">
                    {account.recentTransactions.slice(0, 5).map((txn, ti) => (
                      <div
                        key={ti}
                        className="flex items-center justify-between border-b border-slate-50 py-2 last:border-0"
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="text-xs font-medium text-foreground truncate">{txn.description}</p>
                          <p className="text-[11px] text-muted-foreground">{fmtDate(txn.date)}</p>
                        </div>
                        <span
                          className={`text-xs font-semibold whitespace-nowrap ${
                            txn.type === "credit" ? "text-emerald-600" : "text-red-500"
                          }`}
                        >
                          {txn.type === "credit" ? "+" : "-"}{fmtINR(txn.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 px-5 py-3">
                <SecondaryButton
                  icon={Eye}
                  onClick={() => setViewAllBank(account.id)}
                  className="w-full justify-center"
                >
                  View All Transactions
                </SecondaryButton>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Total Balance Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25, ease: "easeOut" }}
        className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Total Bank Balance Summary</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Combined balance across all {bankAccounts.length} linked accounts</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">{fmtINR(totalBankBalance)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">As of today</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {bankAccounts.map((acc) => {
            const pct = Math.round((acc.balance / totalBankBalance) * 100);
            return (
              <div key={acc.id} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-foreground">{acc.bankName}</p>
                  <span className="text-[11px] text-muted-foreground">{pct}%</span>
                </div>
                <p className="text-sm font-bold text-foreground">{fmtINR(acc.balance)}</p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200">
                  <div
                    className="h-1.5 rounded-full bg-indigo-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Add Account Dialog (placeholder) */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
          >
            <button
              onClick={() => setShowAddDialog(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                <Building2 className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Add Bank Account</h3>
                <p className="text-xs text-muted-foreground">Link a new bank account</p>
              </div>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Coming soon — Bank account linking will be available in the next update.
            </div>
            <div className="mt-4 flex justify-end">
              <SecondaryButton onClick={() => setShowAddDialog(false)}>Close</SecondaryButton>
            </div>
          </motion.div>
        </div>
      )}

      {/* View All Transactions Dialog (placeholder) */}
      {viewAllBank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          >
            <button
              onClick={() => setViewAllBank(null)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
            {(() => {
              const acc = bankAccounts.find((a) => a.id === viewAllBank);
              if (!acc) return null;
              return (
                <>
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    {acc.bankName} — All Transactions
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">{acc.accountNumber}</p>
                  <TableWrapper>
                    <thead>
                      <tr>
                        <Th>Date</Th>
                        <Th>Description</Th>
                        <Th right>Amount</Th>
                        <Th>Type</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {acc.recentTransactions.map((txn, ti) => (
                        <tr key={ti}>
                          <Td><span className="text-xs text-muted-foreground">{fmtDate(txn.date)}</span></Td>
                          <Td><span className="text-xs">{txn.description}</span></Td>
                          <Td right>
                            <span className={`text-xs font-semibold ${txn.type === "credit" ? "text-emerald-600" : "text-red-500"}`}>
                              {txn.type === "credit" ? "+" : "-"}{fmtINR(txn.amount)}
                            </span>
                          </Td>
                          <Td>
                            <StatusPill status={txn.type} />
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </TableWrapper>
                  <div className="mt-4 flex justify-end">
                    <SecondaryButton onClick={() => setViewAllBank(null)}>Close</SecondaryButton>
                  </div>
                </>
              );
            })()}
          </motion.div>
        </div>
      )}
    </div>
  );
}
