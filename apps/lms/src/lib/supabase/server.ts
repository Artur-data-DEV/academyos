import { auth } from "@academyos/auth";

export async function createClient() {
  const dummyQuery: any = {
    select: (...args: any[]) => dummyQuery,
    eq: (...args: any[]) => dummyQuery,
    in: (...args: any[]) => dummyQuery,
    order: (...args: any[]) => dummyQuery,
    single: (...args: any[]) => dummyQuery,
    maybeSingle: (...args: any[]) => dummyQuery,
    insert: (...args: any[]) => dummyQuery,
    update: (...args: any[]) => dummyQuery,
    upsert: (...args: any[]) => dummyQuery,
    match: (...args: any[]) => dummyQuery,
    then: (onfulfilled: any, onrejected: any) => Promise.resolve({ data: null, error: null }).then(onfulfilled, onrejected),
    catch: (onrejected: any) => Promise.resolve({ data: null, error: null }).catch(onrejected),
    finally: (onfinally: any) => Promise.resolve({ data: null, error: null }).finally(onfinally),
  };

  return {
    auth: {
      getUser: async () => {
        const session = await auth();
        return { data: { user: session?.user ?? null }, error: null };
      }
    },
    from: (...args: any[]) => dummyQuery,
  };
}
