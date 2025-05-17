
"use client";

import type { MenuItem, ItemServingType } from '@/types';
import { PRICES, SERVING_TYPES } from '@/lib/constants';
import { MENU_CATEGORIES } from '@/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { PlusCircle, Coffee as CoffeeIcon, IceCream as IceCreamConeIcon, IceCream2 as IceCreamBowlIcon } from 'lucide-react';
import React, { useState } from 'react';

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem, servingType: ItemServingType, price: number) => void;
}

export default function MenuItemCard({ item, onAddToCart }: MenuItemCardProps) {
  const [selectedServingType, setSelectedServingType] = useState<ItemServingType>(SERVING_TYPES[0]);

  const handleAddToCart = () => {
    const price = PRICES[item.category][selectedServingType];
    onAddToCart(item, selectedServingType, price);
  };

  return (
    <Card className="w-full max-w-sm shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative w-full h-48">
          <Image
            src={`https://placehold.co/300x200.png`}
            alt={item.name}
            layout="fill"
            objectFit="cover"
            data-ai-hint={item.imageHint}
          />
        </div>
        <div className="p-4">
          <CardTitle className="text-xl font-semibold">{item.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <RadioGroup
          defaultValue={selectedServingType}
          onValueChange={(value: string) => setSelectedServingType(value as ItemServingType)}
          className="mb-4"
        >
          <p className="text-sm font-medium text-muted-foreground mb-2">Select type:</p>
          <div className="grid grid-cols-2 gap-2">
            {SERVING_TYPES.map((type) => {
              let TypeSpecificIcon;
              if (type === 'Cone') {
                TypeSpecificIcon = IceCreamConeIcon;
              } else { // type === 'Cup'
                if (item.category === MENU_CATEGORIES.COFFEE) {
                  TypeSpecificIcon = CoffeeIcon;
                } else { // Shakes
                  TypeSpecificIcon = IceCreamBowlIcon;
                }
              }
              return (
                <Label
                  key={type}
                  htmlFor={`${item.id}-${type}`}
                  className={`flex flex-col items-center justify-center rounded-md border-2 p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer
                    ${selectedServingType === type ? 'border-primary bg-primary/10' : 'border-border'}`}
                >
                  <RadioGroupItem value={type} id={`${item.id}-${type}`} className="sr-only" />
                  <TypeSpecificIcon className="mb-1 h-5 w-5" />
                  <span className="text-sm font-medium">{type}</span>
                  <span className="text-xs text-muted-foreground">₹{PRICES[item.category][type]}</span>
                </Label>
              );
            })}
          </div>
        </RadioGroup>
      </CardContent>
      <CardFooter className="p-4">
        <Button onClick={handleAddToCart} className="w-full" variant="default">
          <PlusCircle className="mr-2 h-5 w-5" /> Add to Order
        </Button>
      </CardFooter>
    </Card>
  );
}

