-- DROP SCHEMA public;

CREATE SCHEMA public AUTHORIZATION postgres;

COMMENT ON SCHEMA public IS 'standard public schema';

-- DROP SEQUENCE public.clients_id_seq;

CREATE SEQUENCE public.clients_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.license_downloads_id_seq;

CREATE SEQUENCE public.license_downloads_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.license_number_history_id_seq;

CREATE SEQUENCE public.license_number_history_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.license_numbers_id_seq;

CREATE SEQUENCE public.license_numbers_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.licenses_id_seq;

CREATE SEQUENCE public.licenses_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.products_id_seq;

CREATE SEQUENCE public.products_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.transaction_items_id_seq;

CREATE SEQUENCE public.transaction_items_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.transactions_id_seq;

CREATE SEQUENCE public.transactions_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;-- public.clients definição

-- Drop table

-- DROP TABLE public.clients;

CREATE TABLE public.clients (
	id serial4 NOT NULL,
	eduzz_cus_cod int8 NULL,
	"name" varchar(255) NOT NULL,
	email varchar(255) NULL,
	taxnumber varchar(32) NULL,
	tel varchar(32) NULL,
	tel2 varchar(32) NULL,
	cel varchar(32) NULL,
	address varchar(255) NULL,
	address_number varchar(32) NULL,
	address_country varchar(64) NULL,
	address_district varchar(64) NULL,
	address_comp varchar(64) NULL,
	address_city varchar(64) NULL,
	address_state varchar(32) NULL,
	address_zip_code varchar(32) NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT clients_eduzz_cus_cod_key UNIQUE (eduzz_cus_cod),
	CONSTRAINT clients_pkey PRIMARY KEY (id)
);


-- public.products definição

-- Drop table

-- DROP TABLE public.products;

CREATE TABLE public.products (
	id serial4 NOT NULL,
	eduzz_product_cod int8 NULL,
	"name" varchar(255) NULL,
	sku varchar(64) NULL,
	refund_days int4 NULL,
	chargetype varchar(8) NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT products_eduzz_product_cod_key UNIQUE (eduzz_product_cod),
	CONSTRAINT products_pkey PRIMARY KEY (id)
);


-- public.transactions definição

-- Drop table

-- DROP TABLE public.transactions;

CREATE TABLE public.transactions (
	id serial4 NOT NULL,
	eduzz_trans_cod int8 NULL,
	eduzz_checkoutid int8 NULL,
	value_cents int4 NULL,
	paid bool DEFAULT false NULL,
	payment_method int4 NULL,
	status int4 NULL,
	currency varchar(8) NULL,
	createdate date NULL,
	paiddate date NULL,
	duedate date NULL,
	barcode varchar(128) NULL,
	bankslip_url varchar(255) NULL,
	recovery_url varchar(255) NULL,
	page_checkout_url varchar(255) NULL,
	request_token varchar(128) NULL,
	utm_source varchar(64) NULL,
	utm_medium varchar(64) NULL,
	utm_campaign varchar(64) NULL,
	utm_content varchar(64) NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT transactions_eduzz_trans_cod_key UNIQUE (eduzz_trans_cod),
	CONSTRAINT transactions_pkey PRIMARY KEY (id)
);


-- public.licenses definição

-- Drop table

-- DROP TABLE public.licenses;

CREATE TABLE public.licenses (
	id serial4 NOT NULL,
	client_id int4 NULL,
	product_id int4 NULL,
	license_code uuid DEFAULT uuid_generate_v4() NOT NULL,
	expiration_date date NOT NULL,
	product_quantity int4 DEFAULT 1 NOT NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT licenses_pkey PRIMARY KEY (id),
	CONSTRAINT licenses_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE,
	CONSTRAINT licenses_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);


-- public.transaction_items definição

-- Drop table

-- DROP TABLE public.transaction_items;

CREATE TABLE public.transaction_items (
	id serial4 NOT NULL,
	transaction_id int4 NULL,
	item_id int8 NULL,
	item_name varchar(255) NULL,
	item_value_cents int4 NULL,
	item_product_id int8 NULL,
	item_coupon_code varchar(64) NULL,
	item_coupon_value int4 NULL,
	producer_id int8 NULL,
	item_product_partner_cod int8 NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT transaction_items_pkey PRIMARY KEY (id),
	CONSTRAINT transaction_items_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE CASCADE
);


-- public.license_downloads definição

-- Drop table

-- DROP TABLE public.license_downloads;

CREATE TABLE public.license_downloads (
	id serial4 NOT NULL,
	license_id int4 NOT NULL,
	download_date timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	ip_address varchar(45) NULL,
	user_agent text NULL,
	phone_number varchar(20) NULL,
	CONSTRAINT license_downloads_pkey PRIMARY KEY (id),
	CONSTRAINT license_downloads_license_id_fkey FOREIGN KEY (license_id) REFERENCES public.licenses(id) ON DELETE CASCADE
);
CREATE INDEX idx_license_downloads_download_date ON public.license_downloads USING btree (download_date);
CREATE INDEX idx_license_downloads_license_id ON public.license_downloads USING btree (license_id);


-- public.license_number_history definição

-- Drop table

-- DROP TABLE public.license_number_history;

CREATE TABLE public.license_number_history (
	id serial4 NOT NULL,
	license_id int4 NULL,
	old_whatsapp_number varchar(32) NULL,
	new_whatsapp_number varchar(32) NULL,
	changed_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT license_number_history_pkey PRIMARY KEY (id),
	CONSTRAINT license_number_history_license_id_fkey FOREIGN KEY (license_id) REFERENCES public.licenses(id) ON DELETE CASCADE
);


-- public.license_numbers definição

-- Drop table

-- DROP TABLE public.license_numbers;

CREATE TABLE public.license_numbers (
	id serial4 NOT NULL,
	license_id int4 NULL,
	whatsapp_number varchar(32) NOT NULL,
	active bool DEFAULT true NOT NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT license_numbers_pkey PRIMARY KEY (id),
	CONSTRAINT license_numbers_license_id_fkey FOREIGN KEY (license_id) REFERENCES public.licenses(id) ON DELETE CASCADE
);



-- DROP FUNCTION public.uuid_generate_v1();

CREATE OR REPLACE FUNCTION public.uuid_generate_v1()
 RETURNS uuid
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v1$function$
;

-- DROP FUNCTION public.uuid_generate_v1mc();

CREATE OR REPLACE FUNCTION public.uuid_generate_v1mc()
 RETURNS uuid
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v1mc$function$
;

-- DROP FUNCTION public.uuid_generate_v3(uuid, text);

CREATE OR REPLACE FUNCTION public.uuid_generate_v3(namespace uuid, name text)
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v3$function$
;

-- DROP FUNCTION public.uuid_generate_v4();

CREATE OR REPLACE FUNCTION public.uuid_generate_v4()
 RETURNS uuid
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v4$function$
;

-- DROP FUNCTION public.uuid_generate_v5(uuid, text);

CREATE OR REPLACE FUNCTION public.uuid_generate_v5(namespace uuid, name text)
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v5$function$
;

-- DROP FUNCTION public.uuid_nil();

CREATE OR REPLACE FUNCTION public.uuid_nil()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_nil$function$
;

-- DROP FUNCTION public.uuid_ns_dns();

CREATE OR REPLACE FUNCTION public.uuid_ns_dns()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_ns_dns$function$
;

-- DROP FUNCTION public.uuid_ns_oid();

CREATE OR REPLACE FUNCTION public.uuid_ns_oid()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_ns_oid$function$
;

-- DROP FUNCTION public.uuid_ns_url();

CREATE OR REPLACE FUNCTION public.uuid_ns_url()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_ns_url$function$
;

-- DROP FUNCTION public.uuid_ns_x500();

CREATE OR REPLACE FUNCTION public.uuid_ns_x500()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_ns_x500$function$
;