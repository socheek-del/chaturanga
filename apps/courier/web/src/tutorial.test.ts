import { describeLessons } from '@chaturanga/game-shell/testing';
import { courier } from '@chaturanga/courier';
import { PRODUCT } from '../product.config';
import { tutorial } from './tutorial';

describeLessons(PRODUCT, courier, [tutorial]);
