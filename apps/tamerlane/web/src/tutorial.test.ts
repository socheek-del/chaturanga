import { describeLessons } from '@chaturanga/game-shell/testing';
import { tamerlane } from '@chaturanga/tamerlane';
import { PRODUCT } from '../product.config';
import { tutorial } from './tutorial';

describeLessons(PRODUCT, tamerlane, [tutorial]);
