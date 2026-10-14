CREATE OR REPLACE FUNCTION public.request_withdrawal(_amount numeric, _method text, _details text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare bal numeric; blk boolean;
begin
  if _amount < 5 then raise exception 'Minimum withdrawal is $5'; end if;
  if _method not in ('upi','paypal','bank','usdt') then raise exception 'Invalid method'; end if;
  if length(coalesce(_details,'')) < 3 or length(_details) > 300 then raise exception 'Enter valid payment details'; end if;
  select balance, blocked into bal, blk from public.profiles where id = auth.uid() for update;
  if bal is null then raise exception 'Not signed in'; end if;
  if blk then raise exception 'Account is blocked'; end if;
  if bal < _amount then raise exception 'Not enough balance'; end if;
  update public.profiles set balance = balance - _amount where id = auth.uid();
  insert into public.withdrawals(user_id, amount, method, account_details) values (auth.uid(), _amount, _method, _details);
end $function$;