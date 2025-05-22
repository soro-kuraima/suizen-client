import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { 
  ArrowLeft, 
  ArrowRight, 
  Users, 
  Shield, 
  Clock, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { WalletSetupForm } from '../components/features/wallet/WalletSetupForm';
import { OwnersSetupForm } from '../components/features/wallet/OwnersSetupForm';
import { SpendingLimitsForm } from '../components/features/wallet/SpendingLimitsForm';
import { ReviewAndConfirm } from '../components/features/wallet/ReviewAndConfirm';
import { useCreateWallet } from '../api/hooks/useWallet';
import { CreateWalletRequest } from '../types/wallet';
import { toast } from 'sonner';

interface WalletCreationData {
  // Basic setup
  requiredApprovals: number;
  resetPeriodMs: number;
  
  // Owners
  owners: Array<{
    address: string;
    name: string;
    spendingLimit: string;
  }>;
  
  // Additional settings
  walletName: string;
  description: string;
}

const STEPS = [
  {
    id: 1,
    title: 'Basic Setup',
    description: 'Configure multi-sig requirements',
    icon: Shield,
  },
  {
    id: 2,
    title: 'Add Owners',
    description: 'Add wallet owners and permissions',
    icon: Users,
  },
  {
    id: 3,
    title: 'Spending Limits',
    description: 'Set spending limits and reset periods',
    icon: Clock,
  },
  {
    id: 4,
    title: 'Review & Create',
    description: 'Review and deploy your wallet',
    icon: CheckCircle2,
  },
];

const CreateWalletPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [walletData, setWalletData] = useState<WalletCreationData>({
    requiredApprovals: 2,
    resetPeriodMs: 24 * 60 * 60 * 1000, // 24 hours
    owners: [],
    walletName: '',
    description: '',
  });

  const createWalletMutation = useCreateWallet();

  const updateWalletData = (updates: Partial<WalletCreationData>) => {
    setWalletData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleCreateWallet = async () => {
    try {
      const request: CreateWalletRequest = {
        initialOwners: walletData.owners.map(owner => owner.address),
        initialLimits: walletData.owners.map(owner => owner.spendingLimit),
        requiredApprovals: walletData.requiredApprovals,
        resetPeriodMs: walletData.resetPeriodMs,
      };

      await createWalletMutation.mutateAsync(request);
      
      toast.success('Multi-owner wallet created successfully!');
      navigate('/wallet');
    } catch (error) {
      console.error('Failed to create wallet:', error);
      toast.error('Failed to create wallet. Please try again.');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <WalletSetupForm
            data={walletData}
            onUpdate={updateWalletData}
            onNext={nextStep}
          />
        );
      case 2:
        return (
          <OwnersSetupForm
            data={walletData}
            onUpdate={updateWalletData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 3:
        return (
          <SpendingLimitsForm
            data={walletData}
            onUpdate={updateWalletData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 4:
        return (
          <ReviewAndConfirm
            data={walletData}
            onConfirm={handleCreateWallet}
            onPrev={prevStep}
            isLoading={createWalletMutation.isPending}
          />
        );
      default:
        return null;
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Create Multi-Owner Wallet</h1>
            <p className="text-muted-foreground">
              Set up a secure multi-signature wallet with custom spending policies
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="mb-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Step {currentStep} of {STEPS.length}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            
            {/* Step Indicators */}
            <div className="flex justify-between">
              {STEPS.map((step, index) => {
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                const IconComponent = step.icon;
                
                return (
                  <div
                    key={step.id}
                    className={`flex flex-col items-center space-y-2 ${
                      index < STEPS.length - 1 ? 'flex-1' : ''
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                        isCompleted
                          ? 'bg-primary border-primary text-primary-foreground'
                          : isActive
                          ? 'border-primary text-primary'
                          : 'border-muted text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <IconComponent className="h-5 w-5" />
                      )}
                    </div>
                    
                    <div className="text-center">
                      <div className={`text-sm font-medium ${
                        isActive ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-muted-foreground hidden sm:block">
                        {step.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderStepContent()}
        </motion.div>

        {/* Help Section */}
        <Card className="mt-8 border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-900 dark:text-blue-100">
              <AlertCircle className="mr-2 h-5 w-5" />
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Multi-Signature Wallets</h4>
                <p className="text-muted-foreground">
                  Require multiple owners to approve transactions above spending limits for enhanced security.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Spending Limits</h4>
                <p className="text-muted-foreground">
                  Set individual limits that reset automatically after a specified time period.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateWalletPage;