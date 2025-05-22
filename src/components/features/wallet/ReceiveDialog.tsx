import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Receive, Copy, Check } from 'lucide-react';
import { useWalletSelectors } from '../../../store/walletStore';

interface ReceiveDialogProps {
  walletId: string;
  children: React.ReactNode;
}

export const ReceiveDialog: React.FC<ReceiveDialogProps> = ({ walletId, children }) => {
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const { activeWallet } = useWalletSelectors();

  const handleCopy = async () => {
    if (activeWallet?.id) {
      await navigator.clipboard.writeText(activeWallet.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receive className="h-5 w-5" />
            Receive SUI
          </DialogTitle>
          <DialogDescription>
            Share this wallet address to receive SUI tokens
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="wallet-address">Wallet Address</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="wallet-address"
                value={activeWallet?.id || ''}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Anyone can send SUI tokens to this address. The tokens will be added to your multi-owner wallet balance.
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => setOpen(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
