import { PREFIX_PAYMENT_CODE } from 'src/constants/payment.constants';

export class CodeGeneratorUtils {
  /**
   * Generates a payment code with format {PREFIX}{YYYYMMDD}{SEQUENCE}
   * @param sequence Sequence number for the day
   * @param sequenceLength Length of sequence part (default: 3)
   * @returns Payment code like 'LH20241217001'
   * @example
   * generatePaymentCode(1) // Returns 'LH20241217001'
   * generatePaymentCode(99) // Returns 'LH20241217099'
   */
  static generatePaymentCode(sequence: number, sequenceLength = 3): string {
    const dateStr = this.getFormattedDate();
    const sequenceStr = sequence.toString().padStart(sequenceLength, '0');
    return `${PREFIX_PAYMENT_CODE}${dateStr}${sequenceStr}`;
  }

  /**
   * Extracts payment code from a string (bank transfer content, etc.)
   * @param source Source string to extract from
   * @returns Extracted payment code or null if not found
   * @example
   * extractCode('NGUYEN VAN A thanh toan LH20241217001') // Returns 'LH20241217001'
   */
  static extractCode(source: string): string | null {
    if (!source?.includes(PREFIX_PAYMENT_CODE)) {
      return null;
    }
    const regex = new RegExp(`${PREFIX_PAYMENT_CODE}\\d{11}`);
    const match = source.match(regex);
    return match?.[0] ?? null;
  }

  /**
   * Gets today's payment code prefix for querying
   * @returns Prefix like 'LH20241217'
   */
  static getTodayPrefix(): string {
    return `${PREFIX_PAYMENT_CODE}${this.getFormattedDate()}`;
  }

  /**
   * Gets formatted date string
   * @param date Date to format (default: today)
   * @param format Date format (default: 'YYYYMMDD')
   * @returns Formatted date string
   */
  private static getFormattedDate(date = new Date(), format = 'YYYYMMDD'): string {
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    return format
      .replace('YYYY', year)
      .replace('YY', year.slice(-2))
      .replace('MM', month)
      .replace('DD', day);
  }
}
