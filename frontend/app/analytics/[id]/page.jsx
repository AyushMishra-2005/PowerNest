"use client"

import {useParams} from 'next/navigation'
import { AnalyticsPage } from '@/components/AnalyticsPage';

export default function page() {
  const {id} = useParams();
  return (
    <AnalyticsPage connectionId={id}/>
  )
}
