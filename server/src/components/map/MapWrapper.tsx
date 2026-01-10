"use client";

import Map from './Map';
import { Spot } from '../../stores/mapStore';

type Props = {
  spots: Spot[];
};

export default function MapWrapper({ spots }: Props) {
  return <Map spots={spots} />;
}