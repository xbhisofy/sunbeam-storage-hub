import { useState, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
export function ReviewNotice({ title, description, children, accountAction = false }: { title: string; description: string; children: ReactNode; accountAction?: boolean }) {
  const [open, setOpen] = useState(false);
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild>{children}</DialogTrigger><DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md"><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription>{accountAction ? <Button asChild><Link to="/auth">Sign in to your account</Link></Button> : title === 'Log out' || title === 'Delete account' ? <Button asChild><Link to="/profile">Open account settings</Link></Button> : <Button variant="outline" onClick={() => setOpen(false)}>Done</Button>}</DialogContent></Dialog>;
}
