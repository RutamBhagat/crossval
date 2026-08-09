import { Button } from "@crossval/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@crossval/ui/components/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@crossval/ui/components/sidebar";
import { Skeleton } from "@crossval/ui/components/skeleton";
import { ChevronDown, ChevronUp, LogIn, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

type UserMenuProps = {
  placement?: "header" | "sidebar";
};

export default function UserMenu({ placement = "header" }: UserMenuProps) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const isSidebar = placement === "sidebar";

  if (isPending) {
    if (isSidebar) {
      return (
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuSkeleton showIcon />
          </SidebarMenuItem>
        </SidebarMenu>
      );
    }

    return <Skeleton className="h-8 w-28" />;
  }

  if (!session) {
    if (isSidebar) {
      return (
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/login" />} tooltip="Sign in">
              <LogIn />
              <span>Sign in</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      );
    }

    return (
      <Button render={<Link href="/login" />} variant="outline">
        Sign in
      </Button>
    );
  }

  const signOut = () => {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
        },
      },
    });
  };

  if (isSidebar) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  className="group-data-[collapsible=icon]:justify-center"
                  size="lg"
                  tooltip={session.user.name}
                />
              }
            >
              <UserRound />
              <div className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-medium">{session.user.name}</span>
                <span className="truncate text-sidebar-foreground/65">
                  {session.user.email}
                </span>
              </div>
              <ChevronUp className="ml-auto group-data-[collapsible=icon]:hidden" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="font-medium text-foreground">{session.user.name}</span>
                  <span className="max-w-52 truncate">{session.user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} variant="destructive">
                  <LogOut />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" />}>
        <UserRound data-icon="inline-start" />
        <span className="max-w-32 truncate">{session.user.name}</span>
        <ChevronDown data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="font-medium text-foreground">{session.user.name}</span>
            <span className="max-w-52 truncate">{session.user.email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut} variant="destructive">
            <LogOut />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
