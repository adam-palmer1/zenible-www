import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import NotFound from './NotFound';
import logger from '../utils/logger';

/**
 * Router-level errorElement.
 *
 * Replaces React Router's default developer error screen. A thrown 404 gets
 * the real 404 page; anything else gets the same branded shell with an honest
 * message, because telling someone a page does not exist when the app actually
 * crashed sends them looking for the wrong problem.
 */
export default function RouteError() {
  const error = useRouteError();
  const is404 = isRouteErrorResponse(error) && error.status === 404;

  if (!is404) {
    logger.error('Unhandled route error:', error);
  }

  return <NotFound title={is404 ? undefined : 'Something went wrong loading this page.'} />;
}
