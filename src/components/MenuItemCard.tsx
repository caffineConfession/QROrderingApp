
"use client";

import type { ProductWithMenuDetails, MenuItemDetail as PrismaMenuItemDetail } from '@/types';
import { ItemCategory } from '@/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { PlusCircle, Coffee as CoffeeIcon, IceCream as IceCreamConeIcon, IceCream2 as IceCreamBowlIcon, Info, ImageOff } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';

interface MenuItemCardProps {
  product: ProductWithMenuDetails;
  onAddToCart: (product: ProductWithMenuDetails, selectedMenuItem: PrismaMenuItemDetail) => void;
}

export default function MenuItemCard({ product, onAddToCart }: MenuItemCardProps) {
  const findDefaultSelectableItem = () => {
    return product.menuItems.find(mi => mi.isAvailable && mi.stockQuantity > 0)?.id || null;
  };

  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string | null>(findDefaultSelectableItem());

  useEffect(() => {
    setSelectedMenuItemId(findDefaultSelectableItem());
  }, [product]);

  const selectedMenuItem = product.menuItems.find(mi => mi.id === selectedMenuItemId);

  const handleAddToCart = () => {
    if (selectedMenuItem && selectedMenuItem.isAvailable && selectedMenuItem.stockQuantity > 0) {
      onAddToCart(product, selectedMenuItem);
    }
  };

  const getServingTypeIcon = (servingType: string, productCategory: ItemCategory) => {
    if (servingType === 'Cone') return IceCreamConeIcon;
    if (productCategory === ItemCategory.COFFEE) return CoffeeIcon;
    return IceCreamBowlIcon; 
  };

  const [imageError, setImageError] = useState(false);

  return (
    <Card className="w-full max-w-sm shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden flex flex-col">
      <CardHeader className="p-0">
        <div className="relative w-full h-48 bg-muted">
          {imageError || !product.imageUrl ? (
             <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                <ImageOff size={48} />
                <span className="mt-2 text-xs">No image</span>
             </div>
          ) : (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              style={{ objectFit: "cover" }}
              onError={() => setImageError(true)}
              priority={product.category === ItemCategory.COFFEE} // Example: Prioritize coffee images
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}
           {!product.isAvailable && (
            <Badge variant="destructive" className="absolute top-2 right-2 z-10">Unavailable</Badge>
          )}
        </div>
        <div className="p-4">
          <CardTitle className="text-xl font-semibold">{product.name}</CardTitle>
          {product.description && <CardDescription className="text-xs mt-1">{product.description}</CardDescription>}
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        {product.menuItems.length > 0 ? (
          <RadioGroup
            value={selectedMenuItemId || ""}
            onValueChange={setSelectedMenuItemId}
            className="mb-4"
          >
            <p className="text-sm font-medium text-muted-foreground mb-2">Select type:</p>
            <div className="grid grid-cols-2 gap-2">
              {product.menuItems.map((menuItem) => {
                const IconComponent = getServingTypeIcon(menuItem.servingType, product.category);
                const isDisabled = !menuItem.isAvailable || menuItem.stockQuantity <= 0;
                return (
                  <Label
                    key={menuItem.id}
                    htmlFor={`${product.id}-${menuItem.id}`}
                    className={`flex flex-col items-center justify-center rounded-md border-2 p-3 transition-all
                      ${isDisabled ? 'opacity-50 cursor-not-allowed bg-muted/30' : 'hover:bg-accent hover:text-accent-foreground cursor-pointer'}
                      ${selectedMenuItemId === menuItem.id ? 'border-primary bg-primary/10' : 'border-border'}`}
                  >
                    <RadioGroupItem 
                        value={menuItem.id} 
                        id={`${product.id}-${menuItem.id}`} 
                        className="sr-only" 
                        disabled={isDisabled}
                    />
                    <IconComponent className="mb-1 h-5 w-5" />
                    <span className="text-sm font-medium">{menuItem.servingType}</span>
                    <span className="text-xs text-muted-foreground">₹{menuItem.price.toFixed(2)}</span>
                    {isDisabled && menuItem.stockQuantity <=0 && <span className="text-xs text-destructive mt-0.5">(Out of stock)</span>}
                    {!isDisabled && menuItem.stockQuantity > 0 && menuItem.stockQuantity < 10 && <span className="text-xs text-yellow-600 mt-0.5">(Low stock)</span>}
                  </Label>
                );
              })}
            </div>
          </RadioGroup>
        ) : (
          <div className="text-center text-muted-foreground py-4">
            <Info className="mx-auto h-8 w-8 mb-2"/>
            <p>No serving options currently available for this product.</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 border-t mt-auto">
        <Button 
          onClick={handleAddToCart} 
          className="w-full" 
          variant="default"
          disabled={!selectedMenuItem || !selectedMenuItem.isAvailable || selectedMenuItem.stockQuantity <= 0 || !product.isAvailable}
        >
          <PlusCircle className="mr-2 h-5 w-5" /> Add to Order
        </Button>
      </CardFooter>
    </Card>
  );
}
