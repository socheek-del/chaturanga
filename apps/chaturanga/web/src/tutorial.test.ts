import { describeLessons } from '@chaturanga/game-shell/testing';
import { chaturanga } from '@chaturanga/chaturanga';
import { PRODUCT } from '../product.config';
import { tutorial } from './tutorial';

describeLessons(PRODUCT, chaturanga, [tutorial]);
