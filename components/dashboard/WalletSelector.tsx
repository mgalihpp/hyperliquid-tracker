"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatAddress, isValidAddress, cn } from "@/lib/utils";
import {
  Plus,
  X,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Download,
  Upload,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface WalletSelectorProps {
  wallets: string[];
  selectedWallet: string | null;
  onSelectWallet: (wallet: string | null) => void;
  onAddWallet: (wallet: string) => void;
  onRemoveWallet: (wallet: string) => void;
  onClearAll: () => void;
  onImportWallets: (wallets: string[]) => void;
  isTestnet: boolean;
}

export function WalletSelector({
  wallets,
  selectedWallet,
  onSelectWallet,
  onAddWallet,
  onRemoveWallet,
  onClearAll,
  onImportWallets,
  isTestnet,
}: WalletSelectorProps) {
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddWallet = () => {
    const address = inputValue.trim();

    if (!address) {
      setInputError("Please enter a wallet address");
      return;
    }

    if (!isValidAddress(address)) {
      setInputError("Invalid Ethereum address format");
      return;
    }

    if (wallets.includes(address.toLowerCase()) || wallets.includes(address)) {
      setInputError("Wallet already added");
      return;
    }

    onAddWallet(address);
    setInputValue("");
    setInputError(null);
    toast.success("Wallet added", {
      description: `${formatAddress(address)} has been added to tracking`,
    });
  };

  const handleRemoveWallet = (wallet: string) => {
    onRemoveWallet(wallet);
    if (selectedWallet === wallet) {
      onSelectWallet(wallets.find((w) => w !== wallet) ?? null);
    }
    toast.info("Wallet removed", {
      description: `${formatAddress(wallet)} has been removed from tracking`,
    });
  };

  const handleClearAll = () => {
    onClearAll();
    setShowClearConfirm(false);
    toast.success("All wallets cleared", {
      description: "All wallet addresses have been removed",
    });
  };

  const handleExport = () => {
    const data = {
      wallets,
      exportedAt: new Date().toISOString(),
      network: isTestnet ? "testnet" : "mainnet",
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hyperliquid-wallets-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Wallets exported", {
      description: `${wallets.length} wallet(s) exported to JSON file`,
    });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        let importedWallets: string[] = [];

        // Support both array format and object with wallets property
        if (Array.isArray(data)) {
          importedWallets = data;
        } else if (data.wallets && Array.isArray(data.wallets)) {
          importedWallets = data.wallets;
        } else {
          throw new Error("Invalid format");
        }

        // Validate addresses
        const validWallets = importedWallets.filter((w) => {
          if (typeof w !== "string") return false;
          return isValidAddress(w.trim());
        });

        if (validWallets.length === 0) {
          toast.error("No valid wallets found", {
            description: "The imported file contains no valid Ethereum addresses",
          });
          return;
        }

        // Filter out duplicates
        const newWallets = validWallets.filter(
          (w) => !wallets.includes(w) && !wallets.includes(w.toLowerCase())
        );

        if (newWallets.length === 0) {
          toast.info("No new wallets", {
            description: "All wallets in the file are already being tracked",
          });
          return;
        }

        onImportWallets(newWallets);
        toast.success("Wallets imported", {
          description: `${newWallets.length} new wallet(s) added`,
        });
      } catch {
        toast.error("Import failed", {
          description: "Could not parse the JSON file. Please check the format.",
        });
      }
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success("Address copied to clipboard");
  };

  const openExplorer = (address: string) => {
    const baseUrl = isTestnet
      ? "https://testnet.hyperliquid.xyz"
      : "https://app.hyperliquid.xyz";
    window.open(`${baseUrl}/explorer/address/${address}`, "_blank");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Tracked Wallets
          {wallets.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {wallets.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add wallet input */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="0x..."
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setInputError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddWallet();
                }
              }}
              className={cn(
                "font-mono text-sm",
                inputError && "border-red-500 focus-visible:ring-red-500"
              )}
            />
            <Button
              size="icon"
              onClick={handleAddWallet}
              disabled={!inputValue.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {inputError && (
            <div className="flex items-center gap-1 text-xs text-red-500">
              <AlertCircle className="h-3 w-3" />
              {inputError}
            </div>
          )}
        </div>

        {/* Import/Export/Clear buttons */}
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" />
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={handleExport}
            disabled={wallets.length === 0}
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
          {wallets.length > 0 && !showClearConfirm && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-red-500 hover:text-red-500 hover:bg-red-500/10"
              onClick={() => setShowClearConfirm(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Clear confirmation */}
        {showClearConfirm && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-red-500/10 border border-red-500/30">
            <span className="text-xs text-red-500 flex-1">
              Clear all {wallets.length} wallets?
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setShowClearConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleClearAll}
            >
              Clear All
            </Button>
          </div>
        )}

        {/* Wallet list */}
        {wallets.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No wallets added yet</p>
            <p className="text-xs mt-1">
              Add a wallet address above or import from JSON
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {/* "All Wallets" option */}
            {wallets.length > 1 && (
              <button
                onClick={() => onSelectWallet(null)}
                className={cn(
                  "w-full flex items-center justify-between p-2.5 rounded-lg transition-colors text-left",
                  selectedWallet === null
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "hover:bg-muted border border-transparent"
                )}
              >
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  <span className="text-sm font-medium">All Wallets</span>
                </div>
                {selectedWallet === null && (
                  <CheckCircle2 className="h-4 w-4" />
                )}
              </button>
            )}

            {/* Individual wallets */}
            {wallets.map((wallet) => (
              <div
                key={wallet}
                onClick={() => onSelectWallet(wallet)}
                className={cn(
                  "group flex items-center justify-between p-2.5 rounded-lg transition-colors cursor-pointer",
                  selectedWallet === wallet
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "hover:bg-muted border border-transparent"
                )}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                  <span className="font-mono text-sm truncate">
                    {formatAddress(wallet, 6)}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 cursor-pointer hover:bg-blue-500/15 hover:text-blue-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyAddress(wallet);
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 cursor-pointer hover:bg-green-500/15 hover:text-green-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      openExplorer(wallet);
                    }}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 cursor-pointer hover:bg-red-500/15 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveWallet(wallet);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                {selectedWallet === wallet && (
                  <CheckCircle2 className="h-4 w-4 ml-2 shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
