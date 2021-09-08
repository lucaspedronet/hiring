import React, { createContext, useContext, ReactNode, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { formattedData } from '../utils/fetchDataFormatted';

const { SERIES_INTRADAY } = process.env;
const { SYMBOL_SEARCH } = process.env;
const { SYMBOL_GLOBAL_QUOTE } = process.env;

type FetchDataProviderProps = {
  children: ReactNode;
};

type FetchLoadContextData = {
  search(params?: string): Promise<void>;
  loadingIntraday(params: string): Promise<void>;
  loadingGlobalQuote(params: string): Promise<void>;
  saveAsyncStorage(key: string, data: any): Promise<void>;
  getAsyncStorage(key: string): Promise<any | null>;
  loading: boolean;
  bestMatchesActions: BestMatches[];
  detailsAction: DetailsActionProps;
};

type IntraDayData = {
  'Meta Data': MetaData;
  'Time Series (5min)': {
    [key in string]: TimesSeries;
  };
};

type TimesSeries = {
  [key in TimeAttribution]: string;
};

type MetaData = {
  [key in MetaDataAttribution]: string;
};

type MetaDataAttribution =
  | '1. open'
  | '2. high'
  | '3. low'
  | '4. close'
  | '5. volume';

type TimeAttribution =
  | '1. Information'
  | '2. Symbol'
  | '3. Last Refreshed'
  | '4. Interval'
  | '5. Output Size'
  | '6. Time Zone';

type RequestSearch = {
  bestMatches: BestMatches[];
};

type RequestDetailsActions = {
  'Global Quote': DetailsActionAttributions;
};

type BestMatches = {
  [key in BestMatchesAttributions]: string;
};

type BestMatchesAttributions =
  | '1. symbol'
  | '2. name'
  | '3. type'
  | '4. region'
  | '5. marketOpen'
  | '6. marketClose'
  | '7. timezone'
  | '8. currency'
  | '9. matchScore';

type DetailsActionProps = {
  [key in DetailsActionAttributions]: string;
};

type DetailsActionAttributions =
  | '01. symbol'
  | '02. open'
  | '03. high'
  | '04. low'
  | '05. price'
  | '06. volume'
  | '07. latest trading day'
  | '08. previous close'
  | '09. change'
  | '10. change percent';

const FetchLoadContext = createContext<FetchLoadContextData>(
  {} as FetchLoadContextData,
);

function FetchDataProvider({ children }: FetchDataProviderProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [series, setSeries] = useState<IntraDayData>();
  const [bestMatchesActions, setBestMatchesActions] = useState<BestMatches[]>(
    [],
  );
  const [detailsAction, setDetailsAction] = useState<DetailsActionProps>(
    {} as DetailsActionProps,
  );

  async function search(keywords: string = ''): Promise<void> {
    try {
      setLoading(true);
      const response = await api.get('', {
        params: {
          keywords,
          function: SYMBOL_SEARCH,
        },
      });

      const { bestMatches } = response.data as RequestSearch;

      setBestMatchesActions(bestMatches);
      /**
       * Esta function realiza a formatação do response.data, entretanto até o momento
       * não houve ncessidade de utilizar no projeto
       */
      // formattedData(bestMatches);
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      console.log(error);
      throw new Error(error);
    }
  }

  async function loadingIntraday(symbol: string): Promise<void> {
    try {
      setLoading(true);
      const response = await api.get('', {
        params: {
          function: SERIES_INTRADAY,
          symbol,
        },
      });

      console.log(response);
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      console.log(error);
      throw new Error(error);
    }
  }

  async function loadingGlobalQuote(symbol: string): Promise<void> {
    try {
      setLoading(true);
      const response = await api.get('', {
        params: {
          symbol,
          function: SYMBOL_GLOBAL_QUOTE,
        },
      });

      console.log(response.data);
      const data = response.data as RequestDetailsActions;

      setDetailsAction(data['Global Quote']);
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      console.log(error);
      throw new Error(error);
    }
  }

  async function saveAsyncStorage(key: string, data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
      console.log(await getAsyncStorage(key));
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async function getAsyncStorage(key: string): Promise<any | null> {
    try {
      const response = await AsyncStorage.getItem(key);
      return response;
    } catch (error) {
      throw new Error(error);
    }
  }

  return (
    <FetchLoadContext.Provider
      value={{
        loadingIntraday,
        search,
        loadingGlobalQuote,
        saveAsyncStorage,
        getAsyncStorage,
        bestMatchesActions,
        loading,
        detailsAction,
      }}>
      {children}
    </FetchLoadContext.Provider>
  );
}

function useFetch(): FetchLoadContextData {
  const context = useContext(FetchLoadContext);

  if (!context) {
    throw Error('userAuth must be used within an FetchDataProvider');
  }

  return context;
}

export { FetchDataProvider, useFetch };