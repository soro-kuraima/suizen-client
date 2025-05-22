import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../../ui/form';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { 
  Users, 
  Plus, 
  Trash2, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle,
  User,
  Wallet
} from 'lucide-react';
import { Alert, AlertDescription } from '../../ui/alert';
import { Separator } from '../../ui/separator';
import { validateAndNormalizeSuiAddress, shortenAddress } from '../../../utils/sui';
import { useWalletAdapter } from '../../../hooks/useWalletAdapter';

const ownerSchema = z.object({
  address: z.string().min(1, 'Address is required').refine(
    (addr) => validateAndNormalizeSuiAddress(addr) !== null,
    'Invalid Sui address format'
  ),
  name: z.string().min(1, 'Name is required').max(30, 'Name too long'),
  spendingLimit: z.string().min(1, 'Spending limit is required').refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    'Must be a positive number'
  ),
});

type OwnerData = z.infer<typeof ownerSchema>;

interface OwnersSetupFormProps {
  data: {
    owners: Array<{
      address: string;
      name?: string;
      spendingLimit?: string;
    }>;
    requiredApprovals: number;
  };
  onUpdate: (updates: Partial<any>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const OwnersSetupForm: React.FC<OwnersSetupFormProps> = ({
  data,
  onUpdate,
  onNext,
  onPrev,
}) => {
  const { currentAccount } = useWalletAdapter();
  const [owners, setOwners] = useState(data.owners);
  const [isAddingOwner, setIsAddingOwner] = useState(false);
  
  const form = useForm<OwnerData>({
    resolver: zodResolver(ownerSchema),
    defaultValues: {
      address: '',
      name: '',
      spendingLimit: '1.0',
    },
  });

  const addCurrentWalletAsOwner = () => {
    if (currentAccount && !owners.some(o => o.address === currentAccount.address)) {
      const newOwner = {
        address: currentAccount.address,
        name: 'Me (Current Wallet)',
        spendingLimit: '1.0',
      };
      setOwners([...owners, newOwner]);
    }
  };

  const onSubmitOwner = (values: OwnerData) => {
    const normalizedAddress = validateAndNormalizeSuiAddress(values.address);
    if (!normalizedAddress) {
      form.setError('address', { message: 'Invalid Sui address' });
      return;
    }

    // Check for duplicate addresses
    if (owners.some(owner => owner.address === normalizedAddress)) {
      form.setError('address', { message: 'This address is already added' });
      return;
    }

    const newOwner = {
      ...values,
      address: normalizedAddress,
    };

    setOwners([...owners, newOwner]);
    form.reset({
      address: '',
      name: '',
      spendingLimit: '1.0',
    });
    setIsAddingOwner(false);
  };

  const removeOwner = (index: number) => {
    setOwners(owners.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (owners.length === 0) {
      return;
    }
    
    if (owners.length < data.requiredApprovals) {
      return;
    }

    onUpdate({ owners });
    onNext();
  };

  const canProceed = owners.length >= data.requiredApprovals && owners.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-5 w-5" />
          Add Wallet Owners
        </CardTitle>
        <CardDescription>
          Add owners who will have access to this multi-signature wallet
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Wallet Quick Add */}
        {currentAccount && !owners.some(o => o.address === currentAccount.address) && (
          <Alert>
            <Wallet className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Add yourself as an owner?</div>
                  <div className="text-sm text-muted-foreground">
                    {shortenAddress(currentAccount.address)}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={addCurrentWalletAsOwner}>
                  Add Me
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Owners List */}
        {owners.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Wallet Owners ({owners.length})</h4>
              <Badge variant={canProceed ? 'default' : 'secondary'}>
                {owners.length >= data.requiredApprovals ? 'Ready' : `Need ${data.requiredApprovals - owners.length} more`}
              </Badge>
            </div>
            
            <div className="space-y-3">
              {owners.map((owner, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {owner.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{owner.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {shortenAddress(owner.address)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline">
                      {owner.spendingLimit} SUI limit
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOwner(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {owners.length > 0 && <Separator />}

        {/* Add Owner Form */}
        {isAddingOwner ? (
          <div className="border rounded-lg p-4 bg-muted/50">
            <h4 className="font-medium mb-4">Add New Owner</h4>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitOwner)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Alice, Bob" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="spendingLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Spending Limit (SUI)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.1"
                            min="0.1"
                            placeholder="1.0" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sui Address</FormLabel>
                      <FormControl>
                        <Input placeholder="0x..." {...field} />
                      </FormControl>
                      <FormDescription>
                        The owner's Sui wallet address
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex space-x-2">
                  <Button type="submit">Add Owner</Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsAddingOwner(false);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setIsAddingOwner(true)}
            className="w-full border-dashed"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Owner
          </Button>
        )}

        {/* Requirements Check */}
        {owners.length > 0 && (
          <Alert className={canProceed ? 'border-green-200 bg-green-50' : ''}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">Multi-Signature Requirements:</div>
                <div className="text-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Minimum owners required:</span>
                    <Badge variant={owners.length >= data.requiredApprovals ? 'default' : 'secondary'}>
                      {owners.length}/{data.requiredApprovals}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Approvals needed for large transactions:</span>
                    <Badge variant="outline">{data.requiredApprovals} of {owners.length}</Badge>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={onPrev}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          
          <Button 
            onClick={handleNext} 
            disabled={!canProceed}
          >
            Next: Configure Limits
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};