import { describeLessons } from '@chaturanga/game-shell/testing';
import { shatranj } from '@chaturanga/shatranj';
import { PRODUCT } from '../product.config';
import { tutorial } from './tutorial';

describeLessons(PRODUCT, shatranj, [tutorial]);
