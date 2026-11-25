import { describeLessons } from '@chaturanga/game-shell/testing';
import { shatra } from '@chaturanga/shatra';
import { PRODUCT } from '../product.config';
import { tutorial } from './tutorial';

describeLessons(PRODUCT, shatra, [tutorial]);
