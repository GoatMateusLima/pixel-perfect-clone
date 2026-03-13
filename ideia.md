TELA APOS LOGIN E CADASTRO


API FY

cria alguma forma de implementar  aleitura do json dos sites listados pelo usuario e otimizar o uso do site 


-noSQL:
cosmos / mongoDB

-SQL:
MariaDb
oracleDB



tabela, campo, tupla



/courses


  useEffect(() => {

    syncProfile(user.id);
    

  },[]);

  function syncProfile(user: string){
    const (data, error) = supabase.from('profiles').select('*');
  };