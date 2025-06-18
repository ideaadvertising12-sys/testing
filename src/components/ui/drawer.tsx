
"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogTrigger, type DialogProps } from "@radix-ui/react-dialog"
import { Command as CommandPrimitive } from "cmdk"

import { cn } from "@/lib/utils"

const Drawer = ({
  shouldScaleBackground = true,
  ...props
}: DialogProps & {
  shouldScaleBackground?: boolean
}) => (
  <Dialog
    {...props}
    modal={false} // Drawers are typically non-modal
  />
)
Drawer.displayName = "Drawer"

const DrawerTrigger = DialogTrigger
DrawerTrigger.displayName = DialogTrigger.displayName

const DrawerClose = Dialog.Close
DrawerClose.displayName = Dialog.Close.displayName

const DrawerPortal = Dialog.Portal
DrawerPortal.displayName = Dialog.Portal.displayName

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof Dialog.Overlay>,
  React.ComponentPropsWithoutRef<typeof Dialog.Overlay>
>(({ className, ...props }, ref) => (
  <Dialog.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/60", className)}
    {...props}
  />
))
DrawerOverlay.displayName = Dialog.Overlay.displayName

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  React.ComponentPropsWithoutRef<typeof DialogContent> & {
    withOverlay?: boolean
  }
>(({ className, children, withOverlay = true, ...props }, ref) => (
  <DrawerPortal>
    {withOverlay && <DrawerOverlay />}
    <DialogContent
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background",
        // Animation classes (can be adjusted)
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-full data-[state=open]:slide-in-from-bottom-full",
        // Duration (can be adjusted)
        "data-[state=open]:duration-300 data-[state=closed]:duration-200",
        className
      )}
      {...props}
      // Override some DialogContent defaults for drawer behavior
      style={{
        // Reset DialogContent's fixed positioning transforms
        left: 'auto',
        top: 'auto',
        transform: 'none',
        // Ensure it spans the width
        width: '100%',
      }}
      // Prevent closing on pointer down outside for typical drawer behavior
      onPointerDownOutside={(event) => event.preventDefault()}
      onInteractOutside={(event) => event.preventDefault()}
    >
      <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
      {children}
    </DialogContent>
  </DrawerPortal>
))
DrawerContent.displayName = "DrawerContent"


const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
    {...props}
  />
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}
    {...props}
  />
)
DrawerFooter.displayName = "DrawerFooter"

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof Dialog.Title>,
  React.ComponentPropsWithoutRef<typeof Dialog.Title>
>(({ className, ...props }, ref) => (
  <Dialog.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DrawerTitle.displayName = Dialog.Title.displayName

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof Dialog.Description>,
  React.ComponentPropsWithoutRef<typeof Dialog.Description>
>(({ className, ...props }, ref) => (
  <Dialog.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DrawerDescription.displayName = Dialog.Description.displayName


// For nested drawers or command palettes inside drawers
const NestedDrawer = ({ ...props }: DialogProps) => {
  return (
    <Dialog
      modal // Nested drawers often behave modally within the parent drawer
      {...props}
    />
  )
}
NestedDrawer.displayName = "NestedDrawer"

const NestedDrawerTrigger = DialogTrigger
NestedDrawerTrigger.displayName = "NestedDrawerTrigger"

const NestedDrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  React.ComponentPropsWithoutRef<typeof DialogContent>
>(({ className, children, ...props }, ref) => (
  <Dialog.Portal>
    <Dialog.Overlay
      className="fixed inset-0 z-50 bg-black/40" // Slightly less dim for nested
    />
    <DialogContent
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-lg border bg-background pb-6",
        // Different animation for nested if desired, or reuse parent's
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-full data-[state=open]:slide-in-from-bottom-full",
        "data-[state=open]:duration-300 data-[state=closed]:duration-200",
        className
      )}
      {...props}
      style={{
        left: 'auto',
        top: 'auto',
        transform: 'none',
        width: '100%',
      }}
      onPointerDownOutside={(event) => event.preventDefault()}
      onInteractOutside={(event) => event.preventDefault()}
    >
      <div className="mx-auto mt-4 h-2 w-[80px] rounded-full bg-muted" />
      {children}
      <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        {/* Typically an X icon here, but not adding lucide-react dependency here for brevity */}
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        <span className="sr-only">Close</span>
      </Dialog.Close>
    </DialogContent>
  </Dialog.Portal>
))
NestedDrawerContent.displayName = "NestedDrawerContent"


interface DrawerCommandProps extends React.ComponentPropsWithoutRef<typeof CommandPrimitive> {}

const DrawerCommand = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  DrawerCommandProps
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-background text-foreground",
      className
    )}
    {...props}
  />
))
DrawerCommand.displayName = CommandPrimitive.displayName

const DrawerCommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
    {/* Search Icon could be added here */}
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  </div>
))
DrawerCommandInput.displayName = CommandPrimitive.Input.displayName

const DrawerCommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[calc(100vh-12rem)] overflow-y-auto overflow-x-hidden p-2", className)} // Adjusted max-h for drawer context
    {...props}
  />
))
DrawerCommandList.displayName = CommandPrimitive.List.displayName

const DrawerCommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-6 text-center text-sm"
    {...props}
  />
))
DrawerCommandEmpty.displayName = CommandPrimitive.Empty.displayName

const DrawerCommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
      className
    )}
    {...props}
  />
))
DrawerCommandGroup.displayName = CommandPrimitive.Group.displayName

const DrawerCommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
      className
    )}
    {...props}
  />
))
DrawerCommandItem.displayName = CommandPrimitive.Item.displayName

export {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerPortal,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  // Nested Drawer components
  NestedDrawer,
  NestedDrawerTrigger,
  NestedDrawerContent,
  // Command components for Drawer
  DrawerCommand,
  DrawerCommandInput,
  DrawerCommandList,
  DrawerCommandEmpty,
  DrawerCommandGroup,
  DrawerCommandItem,
}

    