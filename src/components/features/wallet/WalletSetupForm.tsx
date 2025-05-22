import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../../ui/form';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Badge } from '../../ui/badge';
import { Shield, Users, ArrowRight, Info } from 'lucide-react';
import { Alert, AlertDescription } from '../../ui/alert';

const walletSetupSchema = z.object({
  walletName: z.string().min(1, 'Wallet name is required').max(50, 'Name too long'),
  description: z.string().max(200, 'Description too long').optional(),
  requiredApprovals: z.number().min(1, 'At least 1 approval required').max(10, 'Maximum 10 approvals'),
});

type WalletSetupData = z.infer<typeof walletSetupSchema>;

interface WalletSetupFormProps {
  data: {
    walletName: string;
    description: string;
    requiredApprovals: number;
  };
  onUpdate: (updates: Partial<any>) => void;
  onNext: () => void;
}

export const WalletSetupForm: React.FC<WalletSetupFormProps> = ({
  data,
  onUpdate,
  onNext,
}) => {
  const form = useForm<WalletSetupData>({
    resolver: zodResolver(walletSetupSchema),
    defaultValues: {
      walletName: data.walletName,
      description: data.description,
      requiredApprovals: data.requiredApprovals,
    },
  });

  const onSubmit = (values: WalletSetupData) => {
    onUpdate(values);
    onNext();
  };

  const requiredApprovals = form.watch('requiredApprovals');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="mr-2 h-5 w-5" />
          Basic Wallet Setup
        </CardTitle>
        <CardDescription>
          Configure your multi-owner wallet's basic settings and security requirements
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Wallet Name */}
            <FormField
              control={form.control}
              name="walletName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wallet Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Team Treasury, Family Savings" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Choose a descriptive name for your multi-owner wallet
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of the wallet's purpose..."
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Add context about how this wallet will be used
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Required Approvals */}
            <FormField
              control={form.control}
              name="requiredApprovals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Required Approvals for Large Transactions</FormLabel>
                  <Select 
                    value={field.value.toString()} 
                    onValueChange={(value) => field.onChange(parseInt(value))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select approval requirement" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} approval{num > 1 ? 's' : ''} required
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Number of owner approvals needed for transactions exceeding individual spending limits
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Security Level Indicator */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <strong>Security Level:</strong>{' '}
                    {requiredApprovals === 1 && <Badge variant="secondary">Basic</Badge>}
                    {requiredApprovals === 2 && <Badge variant="default">Standard</Badge>}
                    {requiredApprovals >= 3 && <Badge variant="default" className="bg-green-600">High</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {requiredApprovals}-of-N multi-signature
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {/* Security Features Preview */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-3 flex items-center">
                <Shield className="mr-2 h-4 w-4" />
                Security Features
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Individual spending limits</span>
                  <Badge variant="outline">✓ Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Multi-signature approval</span>
                  <Badge variant="outline">✓ {requiredApprovals} required</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Time-based limit resets</span>
                  <Badge variant="outline">✓ Configurable</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Transaction proposals</span>
                  <Badge variant="outline">✓ Enabled</Badge>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end">
              <Button type="submit" className="min-w-32">
                Next: Add Owners
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};