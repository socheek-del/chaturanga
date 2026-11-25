import { describeLessons } from '@chaturanga/game-shell/testing';
import { hiashatar } from '@chaturanga/hiashatar';
import { PRODUCT } from '../product.config';
import { tutorial } from './tutorial';

describeLessons(PRODUCT, hiashatar, [tutorial]);
