-- =========================================================
-- STOCK DE PRODUCTOS
-- Corre esto en el SQL Editor de Supabase (una sola vez) si ya
-- creaste la base de datos con schema.sql. Es seguro repetirlo.
-- =========================================================

-- Los productos existentes quedan con stock 0 (agotados) hasta que
-- pongas la cantidad en Admin > Productos.
alter table public.products
  add column if not exists stock integer not null default 0 check (stock >= 0);

-- Al crear un item de pedido: descuenta stock (falla si no alcanza).
create or replace function public.decrement_stock()
returns trigger as $$
declare
  remaining integer;
begin
  if new.product_id is null then
    return new;
  end if;

  update public.products
     set stock = stock - new.quantity
   where id = new.product_id and stock >= new.quantity
  returning stock into remaining;

  if not found then
    raise exception 'Stock insuficiente para "%"', new.product_name;
  end if;

  -- Si se acabó, se marca como agotado automáticamente.
  if remaining = 0 then
    update public.products set is_available = false where id = new.product_id;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_order_item_created on public.order_items;
create trigger on_order_item_created
  before insert on public.order_items
  for each row execute procedure public.decrement_stock();

-- Si el pedido se rechaza o cancela, devuelve el stock (una sola vez).
create or replace function public.restore_stock()
returns trigger as $$
begin
  if new.status in ('rechazado','cancelado')
     and old.status not in ('rechazado','cancelado') then
    update public.products p
       set stock = p.stock + oi.quantity,
           is_available = true
      from public.order_items oi
     where oi.order_id = new.id and oi.product_id = p.id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_order_cancelled on public.orders;
create trigger on_order_cancelled
  after update of status on public.orders
  for each row execute procedure public.restore_stock();
