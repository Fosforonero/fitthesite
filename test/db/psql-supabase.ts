/**
 * Un client di forma Supabase che parla col database LOCALE VERO.
 *
 * Serve a una cosa sola: far girare un route handler senza sostituire il
 * database con un finto. Le RPC sono quelle vere, i trigger sono quelli veri,
 * la proiezione e' quella che il database calcola davvero. L'unica cosa che
 * NON viene esercitata e' il trasporto HTTP verso PostgREST, che qui e'
 * sostituito da psql — e va detto, perche' un test che tace su cosa non copre
 * e' peggio di un test che non esiste.
 *
 * La sostituzione conserva la proprieta' sotto esame. Il difetto che questi
 * test misurano e' "il backend vecchio risponde 200 costruendo il corpo
 * dall'oggetto che ha provato a scrivere, anche quando il trigger ha scartato
 * la scrittura": sia PostgREST sia psql, davanti a un `INSERT ... ON CONFLICT`
 * che tocca zero righe, non segnalano nessun errore. Il chiamante vede lo
 * stesso silenzio in entrambi i casi.
 *
 * I tipi degli argomenti delle RPC si leggono dal catalogo, come fa PostgREST,
 * invece di essere scritti a mano qui: una firma che cambia deve rompere il
 * test, non essere assecondata da una lista parallela.
 */
import { execFileSync } from "node:child_process";

const CID = process.env.SUPABASE_DB_CONTAINER ?? "supabase_db_fitmesh";

/**
 * Il nome del database, parametrizzabile come il contenitore.
 *
 * Serviva: il contenitore condiviso `supabase_db_fitmesh` usa `postgres`,
 * quello usa-e-getta della ricostruzione PG17 usa `ricostruzione`. Senza
 * questa variabile i test contro il database potevano girare SOLO sul
 * condiviso, cioe' su uno schema di provenienza ignota — e un verde contro uno
 * schema che non si e' costruiti non dice a quale schema si riferisce.
 */
const DBN = process.env.SUPABASE_DB_NAME ?? "postgres";

export class PsqlError extends Error {}

export function sql(query: string): string {
  try {
    return execFileSync(
      "docker",
      [
        "exec",
        "-e",
        "PGPASSWORD=postgres",
        CID,
        "psql",
        "-U",
        "postgres",
        "-d",
        DBN,
        "-X",
        "-tA",
        "-v",
        "ON_ERROR_STOP=1",
        "-c",
        query,
      ],
      { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] },
    ).trim();
  } catch (e) {
    const err = e as { stderr?: string; message?: string };
    throw new PsqlError(String(err.stderr ?? err.message ?? e).trim());
  }
}

export function databaseRaggiungibile(): boolean {
  try {
    sql("select 1");
    return true;
  } catch {
    return false;
  }
}

/** Letterale SQL. Nessun input di questi test viene da fuori, ma raddoppiare
 *  gli apici resta il minimo per non produrre SQL che significhi altro. */
function lit(v: unknown): string {
  if (v === null || v === undefined) return "null";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return String(v);
  if (typeof v === "object") return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
  return `'${String(v).replace(/'/g, "''")}'`;
}

const cacheFirme = new Map<string, { nome: string; tipo: string }[]>();

function firmaDi(fn: string): { nome: string; tipo: string }[] {
  const inCache = cacheFirme.get(fn);
  if (inCache) return inCache;
  const raw = sql(
    `select pg_catalog.pg_get_function_identity_arguments(p.oid)
       from pg_catalog.pg_proc p
       join pg_catalog.pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = ${lit(fn)}`,
  );
  if (!raw) throw new PsqlError(`RPC sconosciuta al database: ${fn}`);
  const firma = raw.split(", ").map((pezzo) => {
    const i = pezzo.indexOf(" ");
    return { nome: pezzo.slice(0, i), tipo: pezzo.slice(i + 1) };
  });
  cacheFirme.set(fn, firma);
  return firma;
}

type Risposta<T> = { data: T | null; error: { message: string } | null };

function risolvi<T>(f: () => T): Risposta<T> {
  try {
    return { data: f(), error: null };
  } catch (e) {
    return { data: null, error: { message: (e as Error).message } };
  }
}

/** Costruttore di query con la stessa forma che usa il route handler. */
class Tabella {
  constructor(private readonly nome: string) {}

  upsert(
    row: Record<string, unknown>,
    opts: { onConflict: string },
  ): PromiseLike<Risposta<null>> {
    const colonne = Object.keys(row);
    const set = colonne
      .filter((c) => !opts.onConflict.split(",").includes(c))
      .map((c) => `${c} = excluded.${c}`)
      .join(", ");
    const query =
      `insert into public.${this.nome} (${colonne.join(", ")}) ` +
      `values (${colonne.map((c) => lit(row[c])).join(", ")}) ` +
      `on conflict (${opts.onConflict}) do update set ${set}`;
    const esito = risolvi(() => {
      sql(query);
      return null;
    });
    return { then: (ok) => Promise.resolve(ok!(esito)) };
  }
}

export type ClientPsql = {
  rpc: (fn: string, params: Record<string, unknown>) => PromiseLike<Risposta<unknown>>;
  from: (tabella: string) => Tabella;
};

export function creaClientPsql(): ClientPsql {
  return {
    rpc(fn, params) {
      const esito = risolvi(() => {
        const argomenti = firmaDi(fn)
          .map(({ nome, tipo }) => {
            const v = params[nome];
            return v === null || v === undefined
              ? `${nome} => null::${tipo}`
              : `${nome} => ${lit(v)}::${tipo}`;
          })
          .join(", ");
        const out = sql(`select public.${fn}(${argomenti})::text`);
        return out === "" ? null : (JSON.parse(out) as unknown);
      });
      return { then: (ok) => Promise.resolve(ok!(esito)) };
    },
    from(tabella) {
      return new Tabella(tabella);
    },
  };
}
