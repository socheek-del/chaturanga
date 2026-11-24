import { describeLessons } from '@chaturanga/game-shell/testing';
import { shatar } from '@chaturanga/shatar';
import { PRODUCT } from '../product.config';
import { tutorial } from './tutorial';

describeLessons(PRODUCT, shatar, [tutorial]);
