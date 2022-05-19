import {StringTableLocale, TuningResourceType} from "@s4tk/models/enums";
import {LocaleName, TuningTypeName} from "../util";
import {Conversions} from "../conversions";


it("TuningTypeName should return correct strings", () => {
    expect(TuningTypeName(TuningResourceType.Achievement)).toEqual('Achievement');
});

it("LocaleName should return correct string names", () => {
    expect(LocaleName(Conversions.strToBigInt("0700000099C531AC"))).toEqual('French');
});


