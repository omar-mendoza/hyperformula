import {Ast, AstNodeType} from "./index";
import {SimpleCellAddress} from "../Cell";
import {CellAddress, CellReferenceType} from "./CellAddress";
import {Config} from "../Config";
import {cellHashFromToken} from "./ParserWithCaching";
import {binaryOpTokenMap} from "./binaryOpTokenMap";

export type SheetMappingFn = (sheetId: number) => string

export class Unparser {
  constructor(
      private readonly config: Config,
      private readonly sheetMappingFn: SheetMappingFn
  ) {
  }

  public unparse(ast: Ast, address: SimpleCellAddress): string {
    switch (ast.type) {
      case AstNodeType.NUMBER: {
        return ast.value.toString()
      }
      case AstNodeType.STRING: {
        return "\"" + ast.value + "\""
      }
      case AstNodeType.FUNCTION_CALL: {
        const args = ast.args.map((arg) => this.unparse(arg, address)).join(this.config.functionArgSeparator)
        return ast.procedureName + "(" + args + ")"
      }
      case AstNodeType.CELL_REFERENCE: {
        const sheet = this.sheetMappingFn(ast.reference.sheet)
        return "$" + sheet + "." + addressToString(ast.reference, address)
      }
      case AstNodeType.CELL_RANGE: {
        const sheet = this.sheetMappingFn(ast.start.sheet)
        return "$" + sheet + "." + addressToString(ast.start, address) + ":" + addressToString(ast.end, address)
      }
      case AstNodeType.MINUS_UNARY_OP: {
        return "-" + this.unparse(ast.value, address)
      }
      case AstNodeType.ERROR: {
        return "!ERR"
      }
      default: {
        return this.unparse(ast.left, address) + binaryOpTokenMap[ast.type] + this.unparse(ast.right, address)
      }
    }
  }
}

export function columnIndexToLabel(column: number) {
  let result = '';

  while (column >= 0) {
    result = String.fromCharCode((column % 26) + 97) + result;
    column = Math.floor(column / 26) - 1;
  }

  return result.toUpperCase();
}

export function addressToString(address: CellAddress, baseAddress: SimpleCellAddress): string {
  const simpleAddress = address.toSimpleCellAddress(baseAddress)
  const column = columnIndexToLabel(simpleAddress.col)
  const rowDolar = address.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE || address.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE_ROW ? "$" : ''
  const colDolar = address.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE || address.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE_COL ? "$" : ''
  return `${colDolar}${column}${rowDolar}${simpleAddress.row + 1}`
}