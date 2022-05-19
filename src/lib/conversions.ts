import {ResourceKey} from "@s4tk/models/types";


export class Conversions {
    static toHex(value: number | bigint): string {
        return `0x${value.toString(16).toUpperCase().padStart(16, '0')}`;
    }
    static numToHex64Str(value: number | bigint): string {
        return `${value.toString(16).toUpperCase().padStart(16, '0')}`;
    }
    static strToBigInt(hexValue:string): bigint {
        if(Number.isNaN(hexValue)) {
            throw(`StringHexToBigInt: Invalid string value to convert big decimal: ${hexValue}`)
        }
        return BigInt(`0x${hexValue}`);
    }
    static numToStblRef(value: number): string {
        return `0x${value.toString(16).toUpperCase().padStart(8, '0')}`;
    }

    static numToHex32Str(value: number): string {
        return `${value.toString(16).toUpperCase().padStart(8, '0')}`;
    }

    static generateKeyString(type: number, group: number, inst: bigint): string {
        return `${Conversions.numToHex32Str(type)}!${Conversions.numToHex32Str(group)}!${Conversions.numToHex64Str(inst)}`;
    }
    static keyToString(resourceKey:ResourceKey): string {
        return Conversions.generateKeyString(resourceKey.type, resourceKey.group, resourceKey.instance)
    }
}
