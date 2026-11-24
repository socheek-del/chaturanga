import { describeLessons } from '@chaturanga/game-shell/testing';
import { acedrex } from '@chaturanga/acedrex';
import { PRODUCT } from '../product.config';
import { tutorial } from './tutorial';

describeLessons(PRODUCT, acedrex, [tutorial]);
