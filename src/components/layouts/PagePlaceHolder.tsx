import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Construction, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PagePlaceholder: React.FC<{ 
  title: string; 
  description: string;
  icon?: React.ElementType;
}> = ({ title, description, icon: Icon = Construction }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <div className="mx-auto h-12 w-12 rounded-lg bg-muted flex items-center justify-center mb-4">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" asChild>
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </CardContent>
    </Card>
  </div>
);