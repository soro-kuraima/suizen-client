import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { 
  Clock, 
  ArrowRight, 
  ArrowLeft, 
  User, 
  Calendar,
  Info
} from 'lucide-react';
import { Alert, AlertDescription } from '../../ui/alert';
import { Separator } from '../../ui/separator';
import { shortenAddress } from '../../../utils/sui';

interface SpendingLimitsFormProps {
  data: {
    owners: Array<{
      address: string;
      name: string;
      spendingLimit: string;
    }>;
    resetPeriodMs: number;
  };
  onUpdate: (updates: Partial<any>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const RESET_PERIODS = [
  { label: '1 Hour', value: 60 * 60 * 1000, description: 'Limits reset every hour' },
  { label: '6 Hours', value: 6 * 60 * 60 * 1000, description: 'Limits reset every 6 hours' },
  { label: '12 Hours', value: 12 * 60 * 60 * 1000, description: 'Limits reset every 12 hours' },
  { label: '24 Hours', value: 24 * 60 * 60 * 1000, description: 'Limits reset daily' },
  { label: '7 Days', value: 7 * 24 * 60 * 60 * 1000, description: 'Limits reset weekly' },
  { label: '30 Days', value: 30 * 24 * 60 * 60 * 1000, description: 'Limits reset monthly' },
];

export const SpendingLimitsForm: React.FC<SpendingLimitsFormProps> = ({
  data,
  onUpdate,
  onNext,
  onPrev,
}) => {
  const [owners, setOwners] = useState(data.owners);
  const [resetPeriodMs, setResetPeriodMs] = useState(data.resetPeriodMs);

  const updateOwnerLimit = (index: number, spendingLimit: string) => {
    const updatedOwners = [...owners];
    updatedOwners[index] = { ...updatedOwners[index], spendingLimit };
    setOwners(updatedOwners);
  };

  const setAllLimits = (limit: string) => {
    const updatedOwners = owners.map(owner => ({ ...owner, spendingLimit: limit }));
    setOwners(updatedOwners);
  };

  const handleNext = () => {
    onUpdate({ owners, resetPeriodMs });
    onNext();
  };

  const selectedPeriod = RESET_PERIODS.find(p => p.value === resetPeriodMs);
  const totalLimits = owners.reduce((sum, owner) => sum + parseFloat(owner.spendingLimit), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="mr-2 h-5 w-5" />
          Configure Spending Limits
        </CardTitle>
        <CardDescription>
          Set individual spending limits and reset periods for each owner
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Reset Period Configuration */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">Reset Period</Label>
            <p className="text-sm text-muted-foreground">
              How often spending limits reset for all owners
            </p>
          </div>
          
          <Select 
            value={resetPeriodMs.toString()} 
            onValueChange={(value) => setResetPeriodMs(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select reset period" />
            </SelectTrigger>
            <SelectContent>
              {RESET_PERIODS.map((period) => (
                <SelectItem key={period.value} value={period.value.toString()}>
                  <div className="flex flex-col">
                    <span>{period.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {period.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedPeriod && (
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                <strong>Reset Schedule:</strong> {selectedPeriod.description}. 
                After each reset period, all owners can spend up to their individual limits again.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Separator />

        {/* Individual Owner Limits */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Individual Spending Limits</Label>
              <p className="text-sm text-muted-foreground">
                Set spending limits for each owner (in SUI)
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Label className="text-sm">Set all to:</Label>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                placeholder="1.0"
                className="w-20"
                onChange={(e) => e.target.value && setAllLimits(e.target.value)}
              />
              <span className="text-sm text-muted-foreground">SUI</span>
            </div>
          </div>
          
          <div className="space-y-3">
            {owners.map((owner, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 border rounded-lg">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {owner.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="font-medium">{owner.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {shortenAddress(owner.address)}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={owner.spendingLimit}
                    onChange={(e) => updateOwnerLimit(index, e.target.value)}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">SUI</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium mb-3 flex items-center">
            <Info className="mr-2 h-4 w-4" />
            Spending Configuration Summary
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Total owners:</span>
              <Badge variant="outline">{owners.length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Combined spending limits:</span>
              <Badge variant="outline">{totalLimits.toFixed(2)} SUI</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Reset period:</span>
              <Badge variant="outline">{selectedPeriod?.label}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Multi-sig threshold:</span>
              <Badge variant="outline">Exceeding individual limits</Badge>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">How spending limits work:</div>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Each owner can spend up to their limit without requiring approval</li>
                <li>Transactions exceeding limits require multi-signature approval</li>
                <li>Limits reset automatically based on the selected period</li>
                <li>All spending is tracked per owner, per period</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={onPrev}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          
          <Button onClick={handleNext}>
            Review & Create
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};