import logging
import os
import csv
import json
import dns
import pymongo
from pymongo import MongoClient
from collections import namedtuple
from dotenv import load_dotenv

load_dotenv(verbose=True)
log_format = "%(asctime)s - %(levelname)s - %(message)s"
logging.basicConfig(level=os.environ.get("LOGLEVEL", "DEBUG"), format=log_format)
logger = logging.getLogger("contract-parser")

CSV_FILE_NAME = os.getenv("CSV_FILE_NAME")
MONGODB_CONNECTION_URL = os.getenv("MONGODB_CONNECTION_URL")
MONGODB_CONNECTION_USERNAME = os.getenv("MONGODB_CONNECTION_USERNAME")
MONGODB_CONNECTION_PASSWORD = os.getenv("MONGODB_CONNECTION_PASSWORD")
MONGODB_CONNECTION_DB_NAME=  os.getenv("MONGODB_CONNECTION_DB_NAME")
BATCH_SIZE = 250

cwd = os.getcwd()
csv_file = cwd + "/" + CSV_FILE_NAME
column_names = "award_id_piid modification_number transaction_number parent_award_agency_id parent_award_agency_name parent_award_id parent_award_modification_number federal_action_obligation total_dollars_obligated base_and_exercised_options_value current_total_value_of_award base_and_all_options_value potential_total_value_of_award action_date period_of_performance_start_date period_of_performance_current_end_date period_of_performance_potential_end_date ordering_period_end_date awarding_agency_code awarding_agency_name awarding_sub_agency_code awarding_sub_agency_name awarding_office_code awarding_office_name funding_agency_code funding_agency_name funding_sub_agency_code funding_sub_agency_name funding_office_code funding_office_name foreign_funding foreign_funding_description sam_exception sam_exception_description recipient_duns recipient_name recipient_doing_business_as_name cage_code recipient_parent_name recipient_parent_duns recipient_country_code recipient_country_name recipient_address_line_1 recipient_address_line_2 recipient_city_name recipient_state_code recipient_state_name recipient_zip_4_code recipient_congressional_district recipient_phone_number recipient_fax_number primary_place_of_performance_country_code primary_place_of_performance_country_name primary_place_of_performance_city_name primary_place_of_performance_county_name primary_place_of_performance_state_code primary_place_of_performance_state_name primary_place_of_performance_zip_4 primary_place_of_performance_congressional_district award_or_idv_flag award_type_code award_type idv_type_code idv_type multiple_or_single_award_idv_code multiple_or_single_award_idv type_of_idc_code type_of_idc type_of_contract_pricing_code type_of_contract_pricing award_description action_type_code action_type solicitation_identifier number_of_actions inherently_governmental_functions inherently_governmental_functions_description product_or_service_code product_or_service_code_description contract_bundling_code contract_bundling dod_claimant_program_code dod_claimant_program_description naics_code naics_description recovered_materials_sustainability_code recovered_materials_sustainability domestic_or_foreign_entity_code domestic_or_foreign_entity dod_acquisition_program_code dod_acquisition_program_description information_technology_commercial_item_category_code information_technology_commercial_item_category epa_designated_product_code epa_designated_product country_of_product_or_service_origin_code country_of_product_or_service_origin place_of_manufacture_code place_of_manufacture subcontracting_plan_code subcontracting_plan extent_competed_code extent_competed solicitation_procedures_code solicitation_procedures type_of_set_aside_code type_of_set_aside evaluated_preference_code evaluated_preference research_code research fair_opportunity_limited_sources_code fair_opportunity_limited_sources other_than_full_and_open_competition_code other_than_full_and_open_competition number_of_offers_received commercial_item_acquisition_procedures_code commercial_item_acquisition_procedures small_business_competitiveness_demonstration_program commercial_item_test_program_code commercial_item_test_program a76_fair_act_action_code a76_fair_act_action fed_biz_opps_code fed_biz_opps local_area_set_aside_code local_area_set_aside price_evaluation_adjustment_preference_percent_difference clinger_cohen_act_planning_code clinger_cohen_act_planning materials_supplies_articles_equipment_code materials_supplies_articles_equipment labor_standards_code labor_standards construction_wage_rate_requirements_code construction_wage_rate_requirements interagency_contracting_authority_code interagency_contracting_authority other_statutory_authority program_acronym parent_award_type_code parent_award_type parent_award_single_or_multiple_code parent_award_single_or_multiple major_program national_interest_action_code national_interest_action cost_or_pricing_data_code cost_or_pricing_data cost_accounting_standards_clause_code cost_accounting_standards_clause gfe_gfp_code gfe_gfp sea_transportation_code sea_transportation undefinitized_action_code undefinitized_action consolidated_contract_code consolidated_contract performance_based_service_acquisition_code performance_based_service_acquisition multi_year_contract_code multi_year_contract contract_financing_code contract_financing purchase_card_as_payment_method_code purchase_card_as_payment_method contingency_humanitarian_or_peacekeeping_operation_code contingency_humanitarian_or_peacekeeping_operation alaskan_native_owned_corporation_or_firm american_indian_owned_business indian_tribe_federally_recognized native_hawaiian_owned_business tribally_owned_business veteran_owned_business service_disabled_veteran_owned_business woman_owned_business women_owned_small_business economically_disadvantaged_women_owned_small_business joint_venture_women_owned_small_business joint_venture_economic_disadvantaged_women_owned_small_bus minority_owned_business subcontinent_asian_asian_indian_american_owned_business asian_pacific_american_owned_business black_american_owned_business hispanic_american_owned_business native_american_owned_business other_minority_owned_business contracting_officers_determination_of_business_size contracting_officers_determination_of_business_size_code emerging_small_business community_developed_corporation_owned_firm labor_surplus_area_firm us_federal_government federally_funded_research_and_development_corp federal_agency us_state_government us_local_government city_local_government county_local_government inter_municipal_local_government local_government_owned municipality_local_government school_district_local_government township_local_government us_tribal_government foreign_government organizational_type corporate_entity_not_tax_exempt corporate_entity_tax_exempt partnership_or_limited_liability_partnership sole_proprietorship small_agricultural_cooperative international_organization us_government_entity community_development_corporation domestic_shelter educational_institution foundation hospital_flag manufacturer_of_goods veterinary_hospital hispanic_servicing_institution receives_contracts receives_grants receives_contracts_and_grants airport_authority council_of_governments housing_authorities_public_tribal interstate_entity planning_commission port_authority transit_authority subchapter_scorporation limited_liability_corporation foreign_owned_and_located for_profit_organization nonprofit_organization other_not_for_profit_organization the_ability_one_program number_of_employees annual_revenue private_university_or_college state_controlled_institution_of_higher_learning land_grant_college_1862 land_grant_college_1890 land_grant_college_1994 minority_institution historically_black_college tribal_college alaskan_native_servicing_institution native_hawaiian_servicing_institution school_of_forestry veterinary_college dot_certified_disadvantage self_certified_small_disadvantaged_business small_disadvantaged_business c8a_program_participant historically_underutilized_business_zone_hubzone_firm sba_certified_8a_joint_venture last_modified_date"

def row_count(csv_fname):
    with open(csv_fname) as f:
        return sum(1 for line in f) - 1 # Remove one for the column header row

def percentage(part, whole):
  percentage = 100 * float(part)/float(whole)
  rounded = int(round(percentage))
  return rounded

def get_contract_record(csv_fname):
    """
    A generator for the data in the csv. This is because the csv files can often contain millions of records and shouldn't be stored in memory all at once.

    :param csv_fname:
        filename/location of the csv.

    :return:
        yields each row as a namedtuple.
    """
    logger.info("Getting contract records")
    ContractRecord = namedtuple('ContractRecord', column_names)
    with open(csv_fname, "r", encoding="latin-1") as contract_records:
        for contract_record in csv.reader(contract_records):
            if len(contract_record) == number_columns:
                ascii_contract_record = (
                    x.encode('ascii', errors='replace').decode() for x in contract_record)
                yield ContractRecord(*ascii_contract_record)
            else:
                raise Exception('The number of columns in the row %s does not match the number of columns %s' %(len(contract_record), number_columns))

def generate_contract_dict(csv_row):
    contract = {
        "awardIdPiid" : csv_row.award_id_piid,
        "parentAwardAgencyName" : csv_row.parent_award_agency_name,
        "federalActionObligation" : csv_row.federal_action_obligation,
        "totalDollarsObligated" : csv_row.total_dollars_obligated,
        "baseAndExercisedOptionsValue" : csv_row.base_and_exercised_options_value,
        "currentTotalValueOfAward" : csv_row.current_total_value_of_award,
        "actionDate" : csv_row.action_date,
        "periodOfPerformanceStartDate" : csv_row.period_of_performance_start_date,
        "periodOfPerformanceCurrentEndDate" : csv_row.period_of_performance_current_end_date,
        "awardingAgencyCode" : csv_row.awarding_agency_code,
        "awardingAgencyName" : csv_row.awarding_agency_name,
        "awardingOfficeCode" : csv_row.awarding_office_code,
        "awardingOfficeName" : csv_row.awarding_office_name,
        "primaryPlaceOfPerformanceZip" : csv_row.primary_place_of_performance_zip_4,
        "awardType" : csv_row.award_type,
        "lastModifiedDate" : csv_row.last_modified_date,
        "recipient" : {
            "name": csv_row.recipient_name,
            "duns": csv_row.recipient_duns,
            "cageCode": csv_row.cage_code
        },
    }
    return contract

def initialize_client():
    try:
        if MONGODB_CONNECTION_URL: # Use the connection_url if populated otherwise build the connection string from individual parameters
            connection_string = MONGODB_CONNECTION_URL
        else:
            connection_string = f"mongodb+srv://{MONGODB_CONNECTION_USERNAME}:{MONGODB_CONNECTION_PASSWORD}@cluster0-mjstf.mongodb.net/{MONGODB_CONNECTION_DB_NAME}?retryWrites=true"
        logger.info(f"Connecting to MongoDB with connection string {connection_string}")
        client = MongoClient(connection_string, serverSelectionTimeoutMS=500)
        info = client.server_info() # force connection on a request as the
                            # connect=True parameter of MongoClient seems
                            # to be useless here 
        logger.info("Server info: %s" %(info))
        return client
    except pymongo.errors.ServerSelectionTimeoutError as err:
        raise Exception(f"An error occured connecting to MongoDB: \n {err}")

def parse_and_insert_rows(number_rows, collection):
    """
        Parses batches and then bulk inserts rows in increments of BATCH_SIZE
    """
    iter_contract = iter(get_contract_record(csv_file))
    next(iter_contract)  # Skipping the column names
    batch = []
    current_range_min = 1
    current_range_max = BATCH_SIZE
    for idx, row in enumerate(iter_contract, start=1):
        logger.info(f"Row {idx} of {number_rows} -- {percentage(idx, number_rows)}% Rows Proccessed")
        batch.append(generate_contract_dict(row))
        if (idx == 1):
            continue
        elif ( idx % BATCH_SIZE) == 0:
            logger.info(f"Bulk inserting records from {current_range_min} to {current_range_max}")
            collection.insert_many(batch)
            current_range_min = idx
            next_max = number_rows if (current_range_min + BATCH_SIZE >= number_rows) else current_range_min + BATCH_SIZE
            current_range_max = next_max
            logger.info("Inserted")
            batch = []
        elif ( idx == number_rows):
            logger.info(f"Bulk inserting records from {current_range_min} to {current_range_max}")
            collection.insert_many(batch)
            logger.info("Inserted")
        

number_columns = len(column_names.split())
number_rows = row_count(csv_file)

logger.info("BEGIN")
logger.info("Number of columns: %s " %(number_columns))
logger.info("Number of rows: %s " %(number_rows))

client = initialize_client()
db = client.govalert
contracts_collection = db.contracts
parse_and_insert_rows(number_rows, contracts_collection)
logger.info("END")

