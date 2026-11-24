import { describeLessons } from '@chaturanga/game-shell/testing';
import { maharajah } from '@chaturanga/maharajah';
import { PRODUCT } from '../product.config';
import { tutorial } from './tutorial';

describeLessons(PRODUCT, maharajah, [tutorial]);
