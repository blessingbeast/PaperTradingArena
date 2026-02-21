
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowUp, ArrowDown } from 'lucide-react';

export default function FNOPage() {
    const [instrument, setInstrument] = useState('NIFTY');
    const [expiry, setExpiry] = useState('28 SEP');

    // Mock Option Chain Data
    const strikePrices = [19500, 19550, 19600, 19650, 19700, 19750, 19800];
    const optionChain = strikePrices.map(strike => ({
        strike,
        ce: { ltp: Math.abs(19650 - strike) * 0.5 + Math.random() * 50, oi: Math.floor(Math.random() * 1000000) },
        pe: { ltp: Math.abs(strike - 19650) * 0.5 + Math.random() * 50, oi: Math.floor(Math.random() * 1000000) }
    }));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Trade F&O</h1>
                <div className="flex gap-2">
                    <select
                        className="px-3 py-2 border rounded-md dark:bg-gray-900 dark:border-gray-700"
                        value={instrument}
                        onChange={(e) => setInstrument(e.target.value)}
                    >
                        <option>NIFTY</option>
                        <option>BANKNIFTY</option>
                    </select>
                    <select
                        className="px-3 py-2 border rounded-md dark:bg-gray-900 dark:border-gray-700"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                    >
                        <option>28 SEP</option>
                        <option>05 OCT</option>
                    </select>
                </div>
            </div>

            {/* Spot Price Info */}
            <Card>
                <CardContent className="p-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold">{instrument} Spot</h2>
                        <div className="text-3xl font-bold text-green-600 flex items-center gap-2">
                            19,650.50 <ArrowUp className="w-5 h-5" />
                        </div>
                        <p className="text-green-600 text-sm font-medium">+120.50 (0.62%)</p>
                    </div>

                    <div className="text-right">
                        <p className="text-sm text-gray-500">Future Price</p>
                        <div className="text-2xl font-bold">19,710.00</div>
                        <Button size="sm" className="mt-2">Trade Futures</Button>
                    </div>
                </CardContent>
            </Card>

            {/* Option Chain Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Option Chain</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-center">
                            <thead>
                                <tr className="bg-gray-100 dark:bg-gray-800">
                                    <th className="py-2 px-2" colSpan={2}>CALLS (CE)</th>
                                    <th className="py-2 px-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-500">STRIKE</th>
                                    <th className="py-2 px-2" colSpan={2}>PUTS (PE)</th>
                                </tr>
                                <tr className="border-b dark:border-gray-800 text-xs text-gray-500">
                                    <th className="py-2 px-2">OI</th>
                                    <th className="py-2 px-2">LTP</th>
                                    <th className="py-2 px-2"></th>
                                    <th className="py-2 px-2">LTP</th>
                                    <th className="py-2 px-2">OI</th>
                                </tr>
                            </thead>
                            <tbody>
                                {optionChain.map((row) => (
                                    <tr key={row.strike} className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
                                        <td className="py-2 px-2 text-gray-500">{row.ce.oi.toLocaleString()}</td>
                                        <td className="py-2 px-2 font-medium hover:text-blue-600 cursor-pointer text-green-600">
                                            ₹{row.ce.ltp.toFixed(2)}
                                        </td>
                                        <td className="py-2 px-2 bg-yellow-50 dark:bg-yellow-900/10 font-bold">{row.strike}</td>
                                        <td className="py-2 px-2 font-medium hover:text-blue-600 cursor-pointer text-red-600">
                                            ₹{row.pe.ltp.toFixed(2)}
                                        </td>
                                        <td className="py-2 px-2 text-gray-500">{row.pe.oi.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
