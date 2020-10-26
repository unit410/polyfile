import React, { ReactElement, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { AppProps } from 'next/app';
import { ThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import { QueryParamProvider } from 'use-query-params';
import { DialogProvider } from 'muibox';
import { SnackbarProvider } from 'notistack';
import dynamic from 'next/dynamic';

import theme from '~/common/theme';
import { useRouter } from 'next/dist/client/router';
import LoadingIndicatorProvider from '~/components/LoadingIndicatorProvider';
import ColumnLayout from '~/components/ColumnLayout';
import Page from '~/components/Page';
import LedgerProvider from '~/components/LedgerProvider';

// sidebar loads useLocalStorage which uses CustomEvent that is not available when compiling in node
// just wrapping in <NoSsr> is not sufficient since next tries to compile the file for SSR use
const Sidebar = dynamic(() => import('~/components/Sidebar'), { ssr: false });

export default function App(props: AppProps): ReactElement {
  const { Component, pageProps } = props;

  useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles) {
      jssStyles.parentElement?.removeChild(jssStyles);
    }
  }, []);

  const router = useRouter();
  const match = router.asPath.match(/[^?]+/);
  const pathname = match ? match[0] : router.asPath;

  const location = useMemo(
    () =>
      process.browser
        ? window.location
        : ({
            search: router.asPath.replace(/[^?]+/u, ''),
          } as Location),
    [router.asPath],
  );

  const history = useMemo(
    () => ({
      push: ({ search }: Location) =>
        router.push(
          { pathname: router.pathname, query: router.query },
          { search, pathname },
          { shallow: true },
        ),
      replace: ({ search }: Location) =>
        router.replace(
          { pathname: router.pathname, query: router.query },
          { search, pathname },
          { shallow: true },
        ),
    }),
    [pathname, router],
  );

  // error page should not appear with a sidebar
  if (Component.displayName === 'ErrorPage') {
    return <Component {...pageProps} />;
  }

  return (
    <React.Fragment>
      <Head>
        <title>PolyFile</title>
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LoadingIndicatorProvider>
          <QueryParamProvider history={history} location={location}>
            <SnackbarProvider maxSnack={5}>
              <DialogProvider>
                <ColumnLayout>
                  <LedgerProvider>
                    <Sidebar />
                    <Page>
                      <Component {...pageProps} />
                    </Page>
                  </LedgerProvider>
                </ColumnLayout>
              </DialogProvider>
            </SnackbarProvider>
          </QueryParamProvider>
        </LoadingIndicatorProvider>
      </ThemeProvider>
    </React.Fragment>
  );
}
